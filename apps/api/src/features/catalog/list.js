import { Router } from 'express';
import { Category } from '../../models/Category.js';
import { Recipe, publicRecipeFilter } from '../../models/Recipe.js';

export const catalogRouter = Router();

function positiveInteger(value) {
  return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

catalogRouter.get('/', async (req, res) => {
  const { page = '1', limit = '10' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  if (!positiveInteger(page) || !positiveInteger(limit) || Number(limit) > 48 || !Number.isSafeInteger(offset)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trang phải là số nguyên dương. Mỗi trang có từ 1 đến 48 món.' });
  }
  const filter = publicRecipeFilter();
  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .select('published.title published.summary published.image published.category published.prepMinutes published.cookMinutes published.difficulty published.servings ratingAverage ratingCount')
      .populate({ path: 'published.category', model: Category, select: 'name' })
      .sort({ publishedAt: -1, _id: 1 }).skip(offset).limit(Number(limit)).lean(),
    Recipe.countDocuments(filter),
  ]);
  const items = recipes.map(({ _id, published, ratingAverage, ratingCount }) => ({
    id: _id, ...published,
    category: published.category ? { id: published.category._id, name: published.category.name } : null,
    ratingAverage, ratingCount,
  }));
  res.json({ items, page: Number(page), limit: Number(limit), total });
});
