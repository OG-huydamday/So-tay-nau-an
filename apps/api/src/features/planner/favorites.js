import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { Recipe, publicRecipeFilter } from "../../models/Recipe.js";
import { User } from "../../models/User.js";
import { Category } from "../../models/Category.js";

export const favoritesRouter = Router();
favoritesRouter.use(requireAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
favoritesRouter.param("recipeId", (req, res, next, id) => {
  if (!/^[a-f\d]{24}$/i.test(id))
    return res
      .status(400)
      .json({ code: "INVALID_INPUT", message: "Mã món ăn không hợp lệ." });
  next();
});
favoritesRouter.get("/", async (req, res) => {
  const ids = req.user.favorites;
  const rows = await Recipe.find({ ...publicRecipeFilter(), _id: { $in: ids } })
    .select(
      "published.title published.image published.summary published.difficulty published.totalMinutes published.category",
    )
    .populate({ path: "published.category", model: Category, select: "name" })
    .lean();
  const byId = new Map(
    rows.map(({ _id, published }) => [
      String(_id),
      {
        ...published,
        id: String(_id),
        category: published.category && {
          id: published.category._id,
          name: published.category.name,
        },
      },
    ]),
  );
  res.json({
    items: ids
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .reverse(),
  });
});
favoritesRouter.put("/:recipeId", async (req, res) => {
  const id = req.params.recipeId;
  if (!(await Recipe.exists({ ...publicRecipeFilter(), _id: id }))) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Món này không còn công khai." });
  }
  await User.updateOne({ _id: req.user._id }, { $addToSet: { favorites: id } });
  res.sendStatus(204);
});
favoritesRouter.delete("/:recipeId", async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    { $pull: { favorites: req.params.recipeId } },
  );
  res.sendStatus(204);
});
