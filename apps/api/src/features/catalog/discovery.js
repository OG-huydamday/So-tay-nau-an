// Adapter đọc trên schema published hiện tại. Giữ route danh sách gốc cho truy vấn chỉ phân trang.
import { Router } from "express";
import mongoose from "mongoose";
import { Recipe, publicRecipeFilter } from "../../models/Recipe.js";
import { Category } from "../../models/Category.js";
import { foldText, normalizeText, escapeRegex } from "../../utils/text.js";
import { DIFFICULTIES } from "./constants.js";
export const discoveryRouter = Router();
const validId = (id) => typeof id === "string" && /^[\da-f]{24}$/i.test(id);
const invalid = (res) =>
  res
    .status(400)
    .json({
      code: "INVALID_INPUT",
      message: "Kiểm tra bộ lọc, số trang và tối đa 12 nguyên liệu.",
    });
discoveryRouter.get("/categories", async (_req, res) => {
  const rows = await Category.find().sort({ name: 1 }).select("name").lean();
  res.json({ items: rows.map((row) => ({ id: row._id, name: row.name })) });
});
discoveryRouter.get("/ingredients/suggestions", async (req, res) => {
  const q = req.query.q ?? "";
  if (typeof q !== "string" || q.length > 80) return invalid(res);
  const names = await Recipe.distinct(
    "published.ingredients.nameNormalized",
    publicRecipeFilter(),
  );
  res.json({
    items: names
      .filter((name) => name && foldText(name).includes(foldText(q)))
      .sort()
      .slice(0, 12),
  });
});
discoveryRouter.get("/recipes/:id", async (req, res) => {
  if (!validId(req.params.id)) return invalid(res);
  const row = await Recipe.findOne({
    ...publicRecipeFilter(),
    _id: req.params.id,
  })
    .populate({ path: "published.category", model: Category, select: "name" })
    .lean();
  if (!row)
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Món ăn không còn công khai." });
  const {
    title,
    summary,
    image,
    category,
    ingredients,
    steps,
    totalMinutes,
    difficulty,
    servings,
  } = row.published;
  res.json({
    id: row._id,
    title,
    summary,
    image,
    category: category && { id: category._id, name: category.name },
    ingredients,
    steps,
    totalMinutes,
    difficulty,
    servings,
  });
});
discoveryRouter.get("/recipes", async (req, res, next) => {
  const {
    q = "",
    category = "",
    difficulty = "",
    maxTime = "",
    ingredients = "",
    page = "1",
    limit = "12",
  } = req.query;
  if (![q, category, difficulty, maxTime, ingredients].some(Boolean))
    return next();
  if (
    ![q, category, difficulty, maxTime, ingredients, page, limit].every(
      (v) => typeof v === "string",
    )
  )
    return invalid(res);
  const names = [
    ...new Set(ingredients.split(",").map(normalizeText).filter(Boolean)),
  ];
  const offset = (Number(page) - 1) * Number(limit);
  if (
    !/^[1-9]\d*$/.test(page) ||
    !/^[1-9]\d*$/.test(limit) ||
    Number(limit) > 48 ||
    !Number.isSafeInteger(offset) ||
    q.length > 120 ||
    names.length > 12 ||
    names.some((name) => name.length > 80) ||
    (category && !validId(category)) ||
    (difficulty && !DIFFICULTIES.includes(difficulty)) ||
    (maxTime && !/^\d{1,4}$/.test(maxTime))
  )
    return invalid(res);
  const filter = publicRecipeFilter();
  if (q) filter["published.titleSearch"] = { $regex: escapeRegex(foldText(q)) };
  if (category)
    filter["published.category"] = new mongoose.Types.ObjectId(category);
  if (difficulty) filter["published.difficulty"] = difficulty;
  if (maxTime) filter["published.totalMinutes"] = { $lte: Number(maxTime) };
  if (names.length)
    filter["published.ingredients.nameNormalized"] = { $in: names };
  const [result] = await Recipe.aggregate([
    { $match: filter },
    {
      $set: {
        matched: {
          $setIntersection: [
            "$published.ingredients.nameNormalized",
            { $literal: names },
          ],
        },
      },
    },
    { $set: { score: { $size: "$matched" } } },
    { $sort: { score: -1, ratingAverage: -1, _id: 1 } },
    {
      $facet: {
        count: [{ $count: "total" }],
        items: [
          { $skip: offset },
          { $limit: Number(limit) },
          {
            $lookup: {
              from: Category.collection.name,
              localField: "published.category",
              foreignField: "_id",
              as: "cat",
            },
          },
          {
            $project: {
              _id: 0,
              id: "$_id",
              title: "$published.title",
              summary: "$published.summary",
              image: "$published.image",
              totalMinutes: "$published.totalMinutes",
              difficulty: "$published.difficulty",
              servings: "$published.servings",
              category: {
                id: { $first: "$cat._id" },
                name: { $first: "$cat.name" },
              },
              ratingAverage: 1,
              ratingCount: 1,
              matchedIngredients: "$matched",
              missingIngredients: {
                $setDifference: [
                  "$published.ingredients.nameNormalized",
                  "$matched",
                ],
              },
            },
          },
        ],
      },
    },
  ]);
  res.json({
    items: result.items,
    total: result.count[0]?.total ?? 0,
    page: Number(page),
    limit: Number(limit),
  });
});
