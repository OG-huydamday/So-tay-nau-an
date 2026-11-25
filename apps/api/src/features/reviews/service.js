import mongoose from 'mongoose';
import { Category } from '../../models/Category.js';
import { Recipe, publicRecipeFilter } from '../../models/Recipe.js';
import { Review } from '../../models/Review.js';

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function listPublicReviews({ recipeId, page, limit, offset }) {
  const exists = await Recipe.exists({ _id: recipeId, ...publicRecipeFilter() });
  if (!exists) {
    throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy công thức công khai.');
  }

  const filter = { recipe: recipeId, commentStatus: 'visible' };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate({ path: 'user', select: 'name avatar' })
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const items = reviews.map(r => ({
    id: r._id,
    stars: r.stars,
    comment: r.comment,
    user: r.user ? { id: r.user._id, name: r.user.name, avatar: r.user.avatar ?? null } : null,
    createdAt: r.createdAt,
  }));

  return { items, page, limit, total };
}

export async function createReviewWithTransaction({ recipeId, user, stars, comment }) {
  const session = await mongoose.startSession();
  let output = null;

  try {
    await session.withTransaction(async () => {
      const recipeExists = await Recipe.exists({ _id: recipeId, ...publicRecipeFilter() }).session(session);
      if (!recipeExists) {
        throw new HttpError(404, 'NOT_FOUND', 'Công thức không tồn tại hoặc chưa công khai.');
      }

      let created;
      try {
        [created] = await Review.create([{
          recipe: recipeId,
          user: user._id,
          stars,
          comment,
          commentStatus: 'visible',
        }], { session });
      } catch (err) {
        if (err.code === 11000) {
          throw new HttpError(409, 'REVIEW_ALREADY_EXISTS', 'Bạn đã đánh giá công thức này rồi.');
        }
        throw err;
      }

      const updatedRecipe = await Recipe.findOneAndUpdate(
        { _id: recipeId, ...publicRecipeFilter() },
        [{
          $set: {
            ratingSum: { $add: [{ $ifNull: ['$ratingSum', 0] }, stars] },
            ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
            ratingAverage: {
              $round: [
                {
                  $divide: [
                    { $add: [{ $ifNull: ['$ratingSum', 0] }, stars] },
                    { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
                  ],
                },
                2,
              ],
            },
          },
        }],
        { new: true, session },
      );

      if (!updatedRecipe) {
        throw new HttpError(404, 'NOT_FOUND', 'Công thức không còn công khai.');
      }

      output = {
        review: {
          id: created._id,
          stars: created.stars,
          comment: created.comment,
          commentStatus: created.commentStatus,
          user: { id: user.id, name: user.name, avatar: user.avatar ?? null },
          createdAt: created.createdAt,
        },
        ratingSum: updatedRecipe.ratingSum,
        ratingCount: updatedRecipe.ratingCount,
        ratingAverage: updatedRecipe.ratingAverage,
      };
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new HttpError(409, 'REVIEW_ALREADY_EXISTS', 'Bạn đã đánh giá công thức này rồi.');
    }
    throw err;
  } finally {
    await session.endSession();
  }

  return output;
}

export async function listAdminReviews({ commentStatus, recipeId, page, limit, offset }) {
  const filter = {};
  if (commentStatus) filter.commentStatus = commentStatus;
  if (recipeId) filter.recipe = recipeId;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate({ path: 'user', select: 'name email' })
      .populate({ path: 'recipe', select: 'published.title draft.title visibility deletedAt' })
      .sort({ createdAt: -1, _id: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  const items = reviews.map(r => ({
    id: r._id,
    stars: r.stars,
    comment: r.comment,
    commentStatus: r.commentStatus,
    createdAt: r.createdAt,
    user: r.user ? { id: r.user._id, name: r.user.name, email: r.user.email } : null,
    recipe: r.recipe ? {
      id: r.recipe._id,
      title: r.recipe.published?.title || r.recipe.draft?.title || 'Chưa có tiêu đề',
      visibility: r.recipe.visibility,
      deletedAt: r.recipe.deletedAt,
    } : null,
  }));

  return { items, page, limit, total };
}

export async function updateReviewCommentStatus({ reviewId, commentStatus }) {
  const updated = await Review.findByIdAndUpdate(
    reviewId,
    { $set: { commentStatus } },
    { new: true },
  ).lean();

  if (!updated) {
    throw new HttpError(404, 'NOT_FOUND', 'Không tìm thấy đánh giá.');
  }

  return {
    id: updated._id,
    stars: updated.stars,
    comment: updated.comment,
    commentStatus: updated.commentStatus,
  };
}

export async function getTopRatedRecipes({ page, limit, offset }) {
  const filter = { ...publicRecipeFilter(), ratingCount: { $gt: 0 } };
  const [recipes, total] = await Promise.all([
    Recipe.find(filter)
      .select('published.title published.image published.category ratingSum ratingCount ratingAverage publishedAt')
      .populate({ path: 'published.category', model: Category, select: 'name' })
      .sort({ ratingAverage: -1, ratingCount: -1, _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Recipe.countDocuments(filter),
  ]);

  const items = recipes.map(r => ({
    id: r._id,
    title: r.published?.title,
    image: r.published?.image ?? null,
    category: r.published?.category
      ? { id: r.published.category._id, name: r.published.category.name }
      : null,
    ratingSum: r.ratingSum,
    ratingCount: r.ratingCount,
    ratingAverage: r.ratingAverage,
    publishedAt: r.publishedAt,
  }));

  return { items, page, limit, total };
}
