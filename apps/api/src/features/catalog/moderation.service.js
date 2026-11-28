import { Category } from '../../models/Category.js';
import { Recipe } from '../../models/Recipe.js';
import { User } from '../../models/User.js';

export class ModerationError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const notFound = () => new ModerationError(404, 'NOT_FOUND', 'Không tìm thấy công thức.');

function summary(recipe) {
  return {
    id: recipe._id,
    moderationStatus: recipe.moderationStatus,
    visibility: recipe.visibility,
    draftVersion: recipe.draftVersion,
    publishedVersion: recipe.publishedVersion,
    rejectReason: recipe.rejectReason ?? null,
  };
}

function authorView(author) {
  return author ? { id: author._id, name: author.name, email: author.email } : null;
}

function contentView(content) {
  if (!content) return null;
  return {
    ...content,
    category: content.category ? { id: content.category._id, name: content.category.name } : null,
  };
}

export async function listRecipesForAdmin({ status, visibility, page, limit, offset }) {
  const filter = { deletedAt: null, moderationStatus: status };
  if (visibility) filter.visibility = visibility;
  const sort = status === 'pending' ? { updatedAt: 1, _id: 1 } : { updatedAt: -1, _id: -1 };

  const [rows, total] = await Promise.all([
    Recipe.find(filter)
      .select('author draft.title draft.summary published.title published.summary moderationStatus visibility draftVersion publishedVersion rejectReason updatedAt')
      .populate({ path: 'author', model: User, select: 'name email' })
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .lean(),
    Recipe.countDocuments(filter),
  ]);

  const items = rows.map(row => ({
    id: row._id,
    title: row.draft?.title || row.published?.title || 'Chưa có tiêu đề',
    summary: row.draft?.summary || row.published?.summary || '',
    author: authorView(row.author),
    moderationStatus: row.moderationStatus,
    visibility: row.visibility,
    draftVersion: row.draftVersion,
    publishedVersion: row.publishedVersion,
    hasPublished: Boolean(row.published),
    rejectReason: row.rejectReason ?? null,
    updatedAt: row.updatedAt,
  }));

  return { items, page, limit, total };
}

export async function getRecipeForAdmin(recipeId) {
  const row = await Recipe.findOne({ _id: recipeId, deletedAt: null })
    .populate([
      { path: 'author', model: User, select: 'name email' },
      { path: 'draft.category', model: Category, select: 'name' },
      { path: 'published.category', model: Category, select: 'name' },
    ])
    .lean();
  if (!row) throw notFound();

  return {
    id: row._id,
    author: authorView(row.author),
    moderationStatus: row.moderationStatus,
    rejectReason: row.rejectReason ?? null,
    visibility: row.visibility,
    draftVersion: row.draftVersion,
    publishedVersion: row.publishedVersion,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ratingAverage: row.ratingAverage,
    ratingCount: row.ratingCount,
    draft: contentView(row.draft),
    published: contentView(row.published),
  };
}

function staleVersion(recipe) {
  if (recipe.moderationStatus !== 'pending') {
    return new ModerationError(409, 'CONFLICT', 'Công thức này không còn ở trạng thái chờ duyệt. Hãy tải lại danh sách.');
  }
  return new ModerationError(409, 'CONFLICT', 'Bản nháp đã thay đổi so với bản bạn đang xem. Hãy tải lại bản mới trước khi duyệt.');
}

export async function reviewRecipe({ recipeId, action, version, reason }) {
  const recipe = await Recipe.findOne({ _id: recipeId, deletedAt: null });
  if (!recipe) throw notFound();
  if (recipe.moderationStatus !== 'pending' || recipe.draftVersion !== version) throw staleVersion(recipe);
  if (!recipe.draft) {
    throw new ModerationError(409, 'CONFLICT', 'Công thức chờ duyệt không có bản nháp để duyệt.');
  }

  let update;
  if (action === 'reject') {
    update = { $set: { moderationStatus: 'rejected', rejectReason: reason } };
  } else {
    recipe.published = recipe.draft.toObject();
    try {
      await recipe.validate();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ModerationError(400, 'INVALID_INPUT', 'Bản chờ duyệt chưa đủ thông tin bắt buộc để công khai.');
      }
      throw error;
    }
    update = {
      $set: {
        published: recipe.published.toObject(),
        draft: null,
        moderationStatus: 'approved',
        publishedAt: recipe.publishedAt ?? new Date(),
      },
      $inc: { publishedVersion: 1 },
      $unset: { rejectReason: 1 },
    };
  }

  const updated = await Recipe.findOneAndUpdate(
    { _id: recipe._id, deletedAt: null, moderationStatus: 'pending', draftVersion: version },
    update,
    { new: true },
  ).lean();
  if (!updated) {
    throw new ModerationError(409, 'CONFLICT', 'Công thức vừa được xử lý hoặc cập nhật ở nơi khác. Hãy tải lại.');
  }
  return summary(updated);
}

export async function setRecipeVisibility({ recipeId, visibility }) {
  const updated = await Recipe.findOneAndUpdate(
    { _id: recipeId, deletedAt: null },
    { $set: { visibility } },
    { new: true },
  ).lean();
  if (!updated) throw notFound();
  return summary(updated);
}
