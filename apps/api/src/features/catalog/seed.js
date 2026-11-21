import { Category } from '../../models/Category.js';
import { Recipe } from '../../models/Recipe.js';
import { seedCategories, seedRecipes } from './seedData.js';

function resolveContent(content, categoryIds) {
  if (!content) return null;
  const { categorySlug, ...rest } = content;
  if (categorySlug && !categoryIds[categorySlug]) throw new Error(`Không có loại món "${categorySlug}".`);
  return { ...rest, category: categorySlug ? categoryIds[categorySlug] : undefined };
}

// Chạy lặp an toàn: tìm theo slug (loại món) và seedKey (công thức), không đụng dữ liệu khác.
// Không ghi đè ratingSum, ratingCount, ratingAverage của món đã có.
export async function seedCatalog({ authorId }) {
  const categoryIds = {};
  for (const category of seedCategories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryIds[category.slug] = doc._id;
  }

  for (const item of seedRecipes) {
    const recipe = (await Recipe.findOne({ seedKey: item.seedKey })) ?? new Recipe({ seedKey: item.seedKey });
    recipe.set({
      author: authorId,
      published: resolveContent(item.published, categoryIds),
      draft: resolveContent(item.draft, categoryIds),
      draftVersion: item.draftVersion ?? 0,
      publishedVersion: item.publishedVersion ?? 0,
      moderationStatus: item.moderationStatus,
      rejectReason: item.rejectReason,
      visibility: item.visibility ?? 'visible',
      deletedAt: item.deleted ? (recipe.deletedAt ?? new Date()) : null,
      publishedAt: item.published ? (recipe.publishedAt ?? new Date()) : null,
    });
    await recipe.save();
  }

  return { categories: seedCategories.length, recipes: seedRecipes.length };
}
