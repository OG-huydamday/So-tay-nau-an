import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  listMyRecipes,
  getMyRecipe,
  createDraft,
  updateDraft,
  deleteDraft,
  submitDraftForReview,
} from './recipe.service.js';

function handleRouteError(err, next, res) {
  if (err?.name === 'CastError') {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Giá trị không hợp lệ.' });
  }
  if (err && [400, 403, 404, 409].includes(err.status)) {
    return res.status(err.status).json({
      code: err.code || 'ERROR',
      message: err.message || 'Yêu cầu không hợp lệ.',
    });
  }
  return next(err);
}

export const meRecipesRouter = Router();

meRecipesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await listMyRecipes(req.user._id, req.query);
    return res.json(data);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});

meRecipesRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const recipe = await getMyRecipe(req.params.id, req.user._id);
    return res.json(recipe);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});

export const recipesWriteRouter = Router();

recipesWriteRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const created = await createDraft(req.user._id, req.body);
    return res.status(201).json(created);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});

recipesWriteRouter.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const updated = await updateDraft(req.params.id, req.user._id, req.body);
    return res.json(updated);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});

recipesWriteRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await deleteDraft(req.params.id, req.user._id);
    return res.json(result);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});

recipesWriteRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const submitted = await submitDraftForReview(req.params.id, req.user._id);
    return res.json(submitted);
  } catch (err) {
    return handleRouteError(err, next, res);
  }
});
