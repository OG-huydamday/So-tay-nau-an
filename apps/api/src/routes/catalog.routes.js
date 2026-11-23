import { Router } from 'express';
import {
  listApprovedRecipes,
  getApprovedRecipeById,
  listCategories,
} from '../features/catalog/read.controller.js';

const router = Router();

router.get('/recipes', listApprovedRecipes);
router.get('/recipes/:id', getApprovedRecipeById);
router.get('/categories', listCategories);

export default router;
