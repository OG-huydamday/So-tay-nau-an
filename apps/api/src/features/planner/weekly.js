import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { WeeklyMenu } from "../../models/WeeklyMenu.js";
import { Recipe, publicRecipeFilter } from "../../models/Recipe.js";

const item = z.object({
  recipeId: z.string().regex(/^[a-f0-9]{24}$/),
  servings: z.number().int().min(1).max(50),
});
const meal = z.object({
  day: z.number().int().min(0).max(6),
  slot: z.enum(["breakfast", "lunch", "dinner"]),
  items: z
    .array(item)
    .max(5)
    .refine(
      (items) => new Set(items.map((i) => i.recipeId)).size === items.length,
    ),
});
const input = z.object({
  version: z.number().int().nonnegative(),
  meals: z
    .array(meal)
    .max(21)
    .refine((meals) => new Set(meals.map(key)).size === meals.length),
});
function key(m) {
  return m.day + "-" + m.slot;
}
function indexedItems(meals) {
  return new Map(
    meals.flatMap((m) => m.items.map((i) => [key(m) + "/" + i.recipeId, i])),
  );
}
async function available(meals) {
  const ids = [
    ...new Set(meals.flatMap((m) => m.items.map((i) => String(i.recipeId)))),
  ];
  const rows = await Recipe.find({ ...publicRecipeFilter(), _id: { $in: ids } })
    .select(
      "published.title published.image published.servings published.ingredients",
    )
    .lean();
  return new Map(rows.map((r) => [String(r._id), r.published]));
}
function view(weekStart, version, meals, recipes) {
  return {
    weekStart,
    version,
    meals: meals.map((m) => ({
      ...m,
      items: m.items.map((i) => ({
        ...i,
        available: recipes.has(String(i.recipeId)),
      })),
    })),
  };
}
function conflict(res) {
  return res
    .status(409)
    .json({
      code: "CONFLICT",
      message: "Tuần này vừa được lưu ở nơi khác. Tải bản mới để tiếp tục.",
    });
}
export const weeklyRouter = Router();
weeklyRouter.use(requireAuth, (req, res, next) => {
  const w = req.query.weekStart;
  const date =
    typeof w === "string" && /^\d{4}-\d\d-\d\d$/.test(w)
      ? new Date(w + "T00:00:00Z")
      : null;
  if (!date || date.getUTCDay() !== 1 || !date.toISOString().startsWith(w)) {
    return res
      .status(400)
      .json({
        code: "INVALID_INPUT",
        message: "weekStart phải là ngày thứ Hai dạng YYYY-MM-DD.",
      });
  }
  res.set("Cache-Control", "no-store");
  next();
});
weeklyRouter.get("/", async (req, res) => {
  const { weekStart } = req.query;
  const week = await WeeklyMenu.findOne({
    user: req.user._id,
    weekStart,
  }).lean();
  const meals = week?.meals ?? [];
  res.json(view(weekStart, week?.version ?? 0, meals, await available(meals)));
});
weeklyRouter.put("/", async (req, res) => {
  const parsed = input.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({
        code: "INVALID_INPUT",
        message: "Kiểm tra ô bữa, số phần và món trùng (tối đa 5 món/ô).",
      });
  const { version, meals } = parsed.data;
  const filter = { user: req.user._id, weekStart: req.query.weekStart };
  const previous = await WeeklyMenu.findOne(filter).lean();
  if ((previous?.version ?? 0) !== version) return conflict(res);
  const prior = indexedItems(previous?.meals ?? []);
  const recipes = await available(meals);
  for (const m of meals)
    for (const i of m.items) {
      const old = prior.get(key(m) + "/" + i.recipeId);
      if (old) {
        i.snapshot = old.snapshot;
        continue;
      }
      const r = recipes.get(i.recipeId);
      if (!r)
        return res
          .status(404)
          .json({
            code: "NOT_FOUND",
            message: "Một món vừa bị ẩn hoặc xóa. Hãy thay món rồi lưu.",
          });
      i.snapshot = {
        title: r.title,
        image: r.image,
        servings: r.servings,
        ingredients: r.ingredients,
        capturedAt: new Date(),
      };
    }
  try {
    if (!previous) {
      await WeeklyMenu.init();
      await WeeklyMenu.create({ ...filter, version: 1, meals });
    } else {
      const result = await WeeklyMenu.updateOne(
        { ...filter, version },
        { $set: { meals }, $inc: { version: 1 } },
      );
      if (!result.modifiedCount) return conflict(res);
    }
  } catch (e) {
    if (e.code === 11000) return conflict(res);
    throw e;
  }
  res.json(view(filter.weekStart, version + 1, meals, recipes));
});
