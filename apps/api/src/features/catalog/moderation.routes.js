import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { isObjectId, parsePagination } from '../reviews/schema.js';
import { MODERATION_STATUSES, VISIBILITIES } from './constants.js';
import {
  ModerationError,
  getRecipeForAdmin,
  listRecipesForAdmin,
  reviewRecipe,
  setRecipeVisibility,
} from './moderation.service.js';

const reviewInput = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    version: z.number().int().min(1),
  }),
  z.object({
    action: z.literal('reject'),
    version: z.number().int().min(1),
    reason: z.string().trim().min(1).max(500),
  }),
]);

const visibilityInput = z.object({ visibility: z.enum(VISIBILITIES) });

const invalid = (res, message) => res.status(400).json({ code: 'INVALID_INPUT', message });

function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof ModerationError) {
        return res.status(error.status).json({ code: error.code, message: error.message });
      }
      return next(error);
    }
  };
}

export const adminRecipesRouter = Router();

adminRecipesRouter.use(requireAuth, requireAdmin, (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminRecipesRouter.get('/', handle(async (req, res) => {
  const { status = 'pending', visibility } = req.query;
  if (typeof status !== 'string' || !MODERATION_STATUSES.includes(status)) {
    return invalid(res, 'Trạng thái duyệt phải là draft, pending, approved hoặc rejected.');
  }
  if (visibility !== undefined && (typeof visibility !== 'string' || !VISIBILITIES.includes(visibility))) {
    return invalid(res, 'Trạng thái hiển thị phải là visible hoặc hidden.');
  }
  const pagination = parsePagination(req.query);
  if (!pagination) return invalid(res, 'Trang phải là số nguyên dương. Mỗi trang tối đa 48 mục.');
  res.json(await listRecipesForAdmin({ status, visibility, ...pagination }));
}));

adminRecipesRouter.get('/:id', handle(async (req, res) => {
  if (!isObjectId(req.params.id)) return invalid(res, 'Mã công thức không hợp lệ.');
  res.json(await getRecipeForAdmin(req.params.id));
}));

adminRecipesRouter.post('/:id/review', handle(async (req, res) => {
  if (!isObjectId(req.params.id)) return invalid(res, 'Mã công thức không hợp lệ.');
  const parsed = reviewInput.safeParse(req.body);
  if (!req.is('application/json') || !parsed.success) {
    const reasonIssue = parsed.error?.issues.find(issue => issue.path[0] === 'reason');
    if (reasonIssue) {
      return invalid(res, reasonIssue.code === 'too_big'
        ? 'Lý do từ chối tối đa 500 ký tự.'
        : 'Cần ghi lý do từ chối.');
    }
    return invalid(res, 'Cần gửi action (approve hoặc reject), version và lý do khi từ chối.');
  }
  const { action, version } = parsed.data;
  res.json(await reviewRecipe({
    recipeId: req.params.id,
    action,
    version,
    reason: parsed.data.reason,
  }));
}));

adminRecipesRouter.patch('/:id/visibility', handle(async (req, res) => {
  if (!isObjectId(req.params.id)) return invalid(res, 'Mã công thức không hợp lệ.');
  const parsed = visibilityInput.safeParse(req.body);
  if (!req.is('application/json') || !parsed.success) {
    return invalid(res, 'Trạng thái hiển thị phải là visible hoặc hidden.');
  }
  res.json(await setRecipeVisibility({ recipeId: req.params.id, visibility: parsed.data.visibility }));
}));
