import mongoose from 'mongoose';
import { Recipe } from '../../models/Recipe.js';
import { Category } from '../../models/Category.js';
import { toOwnerView } from './ownerView.js';
import {
  DIFFICULTIES,
  UNITS,
  QUANTITY_TYPES,
} from '../catalog/constants.js';

function makeError(code, message, status = 400) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

function assertObjectId(id, label = 'ID') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw makeError('INVALID_INPUT', `${label} không hợp lệ.`, 400);
  }
}

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return undefined;

  return ingredients.map((item) => {
    const quantityType = item?.quantityType || 'exact';
    if (!QUANTITY_TYPES.includes(quantityType)) {
      throw makeError('INVALID_INPUT', 'quantityType không hợp lệ.', 400);
    }

    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    if (!name) {
      throw makeError('INVALID_INPUT', 'Tên nguyên liệu là bắt buộc.', 400);
    }

    const normalized = {
      name,
      quantityType,
      note: typeof item?.note === 'string' ? item.note.trim() : undefined,
    };

    if (quantityType !== 'to-taste') {
      const qty = Number(item?.quantity);
      const unit = typeof item?.unit === 'string' ? item.unit.trim().toLowerCase() : '';
      if (!Number.isFinite(qty) || qty < 0) {
        throw makeError('INVALID_INPUT', 'Số lượng nguyên liệu không hợp lệ.', 400);
      }
      if (!UNITS.includes(unit)) {
        throw makeError('INVALID_INPUT', 'Đơn vị nguyên liệu không hợp lệ.', 400);
      }
      normalized.quantity = qty;
      normalized.unit = unit;
    }

    return normalized;
  });
}

function normalizeSteps(steps) {
  if (!Array.isArray(steps)) return undefined;

  return steps.map((step, index) => {
    const order = step?.order !== undefined ? Number(step.order) : index + 1;
    const text = typeof step?.text === 'string' ? step.text.trim() : '';
    const image = step?.image === null || step?.image === undefined
      ? null
      : String(step.image).trim() || null;
    const timerMinutes = step?.timerMinutes !== undefined ? Number(step.timerMinutes) : 0;

    if (!Number.isFinite(order) || order < 1) {
      throw makeError('INVALID_INPUT', 'Thứ tự bước làm (order) không hợp lệ.', 400);
    }
    if (!text) {
      throw makeError('INVALID_INPUT', 'Nội dung bước làm (text) là bắt buộc.', 400);
    }
    if (!Number.isFinite(timerMinutes) || timerMinutes < 0) {
      throw makeError('INVALID_INPUT', 'timerMinutes không hợp lệ.', 400);
    }

    return {
      order,
      text,
      image,
      timerMinutes,
    };
  });
}

async function buildDraftPatch(body = {}) {
  const patch = {};

  if (typeof body.title === 'string') {
    patch.title = body.title.trim();
  }
  if (typeof body.summary === 'string') {
    patch.summary = body.summary.trim();
  }
  if (body.image === null || typeof body.image === 'string') {
    patch.image = typeof body.image === 'string' ? body.image.trim() || null : null;
  }
  if (body.category !== undefined) {
    if (body.category === null || body.category === '') {
      patch.category = null;
    } else {
      assertObjectId(body.category, 'Category');
      const exists = await Category.exists({ _id: body.category });
      if (!exists) {
        throw makeError('INVALID_INPUT', 'Danh mục không tồn tại.', 400);
      }
      patch.category = body.category;
    }
  }
  if (body.prepMinutes !== undefined) {
    const val = Number(body.prepMinutes);
    if (!Number.isFinite(val) || val < 0) {
      throw makeError('INVALID_INPUT', 'prepMinutes không hợp lệ.', 400);
    }
    patch.prepMinutes = val;
  }
  if (body.cookMinutes !== undefined) {
    const val = Number(body.cookMinutes);
    if (!Number.isFinite(val) || val < 0) {
      throw makeError('INVALID_INPUT', 'cookMinutes không hợp lệ.', 400);
    }
    patch.cookMinutes = val;
  }
  if (body.difficulty !== undefined) {
    const diff = typeof body.difficulty === 'string' ? body.difficulty.trim() : '';
    if (!DIFFICULTIES.includes(diff)) {
      throw makeError('INVALID_INPUT', 'Độ khó không hợp lệ.', 400);
    }
    patch.difficulty = diff;
  }
  if (body.servings !== undefined) {
    const val = Number(body.servings);
    if (!Number.isFinite(val) || val < 1 || val > 50) {
      throw makeError('INVALID_INPUT', 'servings phải nằm trong khoảng 1 đến 50.', 400);
    }
    patch.servings = val;
  }
  if (body.ingredients !== undefined) {
    patch.ingredients = normalizeIngredients(body.ingredients);
  }
  if (body.steps !== undefined) {
    patch.steps = normalizeSteps(body.steps);
  }
  if (Array.isArray(body.tags)) {
    patch.tags = body.tags
      .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      .filter(Boolean);
  }

  return patch;
}

function validateSubmissionReady(draft) {
  const missing = [];
  if (!draft?.title) missing.push('title');
  if (!draft?.summary) missing.push('summary');
  if (!draft?.category) missing.push('category');
  if (draft?.prepMinutes == null) missing.push('prepMinutes');
  if (draft?.cookMinutes == null) missing.push('cookMinutes');
  if (!draft?.difficulty) missing.push('difficulty');
  if (draft?.servings == null) missing.push('servings');
  if (!Array.isArray(draft?.ingredients) || draft.ingredients.length === 0) {
    missing.push('ingredients');
  }
  if (!Array.isArray(draft?.steps) || draft.steps.length === 0) {
    missing.push('steps');
  }

  if (missing.length > 0) {
    throw makeError(
      'INVALID_INPUT',
      `Thiếu thông tin bắt buộc để gửi duyệt: ${missing.join(', ')}.`,
      400,
    );
  }
}

export async function listMyRecipes(userId, query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    author: userId,
    deletedAt: null,
  };
  if (query.moderationStatus) {
    filter.moderationStatus = query.moderationStatus;
  }

  const [items, total] = await Promise.all([
    Recipe.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Recipe.countDocuments(filter),
  ]);

  return { items: items.map(toOwnerView), page, limit, total };
}

export async function getMyRecipe(recipeId, userId) {
  assertObjectId(recipeId, 'Recipe');

  const recipe = await Recipe.findOne({ _id: recipeId, deletedAt: null });
  if (!recipe) {
    throw makeError('NOT_FOUND', 'Không tìm thấy công thức.', 404);
  }
  if (String(recipe.author) !== String(userId)) {
    throw makeError('FORBIDDEN', 'Bạn không có quyền xem công thức này.', 403);
  }
  return toOwnerView(recipe.toObject());
}

export async function createDraft(userId, payload) {
  const draftData = await buildDraftPatch(payload);
  if (!draftData.title) {
    throw makeError('INVALID_INPUT', 'Tiêu đề bản nháp là bắt buộc.', 400);
  }

  const doc = await Recipe.create({
    author: userId,
    published: null,
    draft: draftData,
    draftVersion: 1,
    publishedVersion: 0,
    moderationStatus: 'draft',
    visibility: 'visible',
    deletedAt: null,
  });

  return toOwnerView(doc.toObject());
}

export async function updateDraft(recipeId, userId, payload) {
  assertObjectId(recipeId, 'Recipe');

  const recipe = await Recipe.findOne({ _id: recipeId, deletedAt: null });
  if (!recipe) {
    throw makeError('NOT_FOUND', 'Không tìm thấy công thức.', 404);
  }
  if (String(recipe.author) !== String(userId)) {
    throw makeError('FORBIDDEN', 'Bạn không có quyền sửa công thức này.', 403);
  }
  if (recipe.moderationStatus === 'pending') {
    throw makeError('CONFLICT', 'Công thức đang chờ duyệt, không thể sửa bản nháp.', 409);
  }

  const patch = await buildDraftPatch(payload);
  let base = {};
  if (recipe.draft) base = recipe.draft.toObject();
  else if (recipe.published) base = recipe.published.toObject();
  const nextDraft = { ...base, ...patch };

  if (!nextDraft.title) {
    throw makeError('INVALID_INPUT', 'Tiêu đề bản nháp là bắt buộc.', 400);
  }

  recipe.draft = nextDraft;
  recipe.draftVersion = (recipe.draftVersion || 0) + 1;
  if (recipe.moderationStatus !== 'draft') {
    recipe.moderationStatus = 'draft';
    recipe.rejectReason = undefined;
  }

  await recipe.save();
  return toOwnerView(recipe.toObject());
}

export async function deleteDraft(recipeId, userId) {
  assertObjectId(recipeId, 'Recipe');

  const recipe = await Recipe.findOne({ _id: recipeId, deletedAt: null });
  if (!recipe) {
    throw makeError('NOT_FOUND', 'Không tìm thấy công thức.', 404);
  }
  if (String(recipe.author) !== String(userId)) {
    throw makeError('FORBIDDEN', 'Bạn không có quyền xóa công thức này.', 403);
  }
  if (recipe.moderationStatus === 'pending') {
    throw makeError('CONFLICT', 'Công thức đang chờ duyệt, không thể xóa.', 409);
  }
  recipe.deletedAt = new Date();
  await recipe.save();

  return { deleted: true, id: String(recipe._id) };
}

export async function submitDraftForReview(recipeId, userId) {
  assertObjectId(recipeId, 'Recipe');

  const recipe = await Recipe.findOne({ _id: recipeId, deletedAt: null });
  if (!recipe) {
    throw makeError('NOT_FOUND', 'Không tìm thấy công thức.', 404);
  }
  if (String(recipe.author) !== String(userId)) {
    throw makeError('FORBIDDEN', 'Bạn không có quyền gửi duyệt công thức này.', 403);
  }
  if (recipe.moderationStatus === 'pending') {
    throw makeError('CONFLICT', 'Công thức đang ở trạng thái chờ duyệt.', 409);
  }

  const draftObj = recipe.draft ? recipe.draft.toObject() : null;
  validateSubmissionReady(draftObj);

  recipe.moderationStatus = 'pending';
  recipe.rejectReason = undefined;
  await recipe.save();

  return toOwnerView(recipe.toObject());
}
