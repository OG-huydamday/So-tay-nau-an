import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { commentStatusSchema, createReviewSchema, isObjectId, parsePagination } from './schema.js';
import {
  HttpError,
  createReviewWithTransaction,
  getTopRatedRecipes,
  listAdminReviews,
  listPublicReviews,
  updateReviewCommentStatus,
} from './service.js';

function handleRoute(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ code: error.code, message: error.message });
      }
      next(error);
    }
  };
}

export const reviewsRouter = Router({ mergeParams: true });

reviewsRouter.get('/', handleRoute(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Mã công thức không hợp lệ.' });
  }
  const pagination = parsePagination(req.query);
  if (!pagination) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trang phải là số nguyên dương. Mỗi trang tối đa 48 mục.' });
  }
  const result = await listPublicReviews({ recipeId: id, ...pagination });
  res.json(result);
}));

reviewsRouter.post('/', requireAuth, handleRoute(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Mã công thức không hợp lệ.' });
  }
  const parsed = createReviewSchema.safeParse(req.body);
  if (!req.is('application/json') || !parsed.success) {
    return res.status(400).json({
      code: 'INVALID_INPUT',
      message: parsed.error?.issues[0]?.message || 'Cần gửi số sao nguyên (1–5) và bình luận.',
    });
  }
  const result = await createReviewWithTransaction({
    recipeId: id,
    user: req.user,
    stars: parsed.data.stars,
    comment: parsed.data.comment,
  });
  res.status(201).json(result);
}));

export const adminReviewsRouter = Router();

adminReviewsRouter.use(requireAuth, requireAdmin, (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminReviewsRouter.get('/reviews', handleRoute(async (req, res) => {
  const { commentStatus, recipeId } = req.query;
  if (commentStatus !== undefined && !['visible', 'hidden'].includes(commentStatus)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trạng thái bình luận không hợp lệ.' });
  }
  if (recipeId !== undefined && !isObjectId(recipeId)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Mã công thức không hợp lệ.' });
  }
  const pagination = parsePagination(req.query);
  if (!pagination) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trang phải là số nguyên dương. Mỗi trang tối đa 48 mục.' });
  }
  const result = await listAdminReviews({ commentStatus, recipeId, ...pagination });
  res.json(result);
}));

adminReviewsRouter.patch('/reviews/:id/comment-status', handleRoute(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Mã đánh giá không hợp lệ.' });
  }
  const parsed = commentStatusSchema.safeParse(req.body);
  if (!req.is('application/json') || !parsed.success) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trạng thái bình luận phải là visible hoặc hidden.' });
  }
  const result = await updateReviewCommentStatus({ reviewId: id, commentStatus: parsed.data.commentStatus });
  res.json(result);
}));

adminReviewsRouter.get('/stats/top-recipes', handleRoute(async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Trang phải là số nguyên dương. Mỗi trang tối đa 48 mục.' });
  }
  const result = await getTopRatedRecipes(pagination);
  res.json(result);
}));
