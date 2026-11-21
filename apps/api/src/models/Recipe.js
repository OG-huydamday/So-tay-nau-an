import mongoose from 'mongoose';
import {
  DIFFICULTIES, UNITS, MODERATION_STATUSES, VISIBILITIES, QUANTITY_TYPES,
} from '../features/catalog/constants.js';
import { foldText, normalizeText } from '../utils/text.js';

const { Schema } = mongoose;

const ingredientSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  // Tên chuẩn hóa (NFC, chữ thường, gộp khoảng trắng) để so khớp $in. Tự điền khi validate.
  nameNormalized: { type: String, default: '' },
  // 'to-taste' = "vừa đủ": không có số lượng và đơn vị, P3 gom thành ghi chú khi đi chợ.
  quantityType: { type: String, enum: QUANTITY_TYPES, default: 'exact' },
  quantity: {
    type: Number,
    min: 0,
    required() { return this.quantityType !== 'to-taste'; },
  },
  unit: {
    type: String,
    trim: true,
    lowercase: true,
    enum: UNITS,
    required() { return this.quantityType !== 'to-taste'; },
  },
  note: { type: String, trim: true, maxlength: 120 },
}, { _id: false });

const stepSchema = new Schema({
  order: { type: Number, required: true, min: 1 },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  image: { type: String, default: null },
  timerMinutes: { type: Number, min: 0, default: 0 },
}, { _id: false });

// Bản nháp được lưu dang dở (complete: false), bản công khai phải đủ trường (complete: true).
function createContentSchema({ complete }) {
  const nonEmpty = { validator: (value) => value.length > 0, message: 'Cần ít nhất một mục.' };
  const mustHaveItems = complete ? { validate: nonEmpty } : {};
  return new Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    titleSearch: { type: String, default: '' }, // tên không dấu, tự điền khi validate
    summary: { type: String, trim: true, maxlength: 320, required: complete },
    image: { type: String, default: null },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: complete },
    prepMinutes: { type: Number, min: 0, required: complete },
    cookMinutes: { type: Number, min: 0, required: complete },
    totalMinutes: { type: Number, min: 0, default: 0 }, // prep + cook, tự điền khi validate
    difficulty: { type: String, enum: DIFFICULTIES, required: complete },
    servings: { type: Number, min: 1, max: 50, required: complete },
    ingredients: { type: [ingredientSchema], default: [], ...mustHaveItems },
    steps: { type: [stepSchema], default: [], ...mustHaveItems },
    tags: { type: [{ type: String, trim: true, lowercase: true }], default: [] },
  }, { _id: false });
}

const recipeSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: createContentSchema({ complete: true }), default: null },
  draft: { type: createContentSchema({ complete: false }), default: null },
  draftVersion: { type: Number, default: 0, min: 0 },
  publishedVersion: { type: Number, default: 0, min: 0 },
  moderationStatus: { type: String, enum: MODERATION_STATUSES, default: 'draft' },
  rejectReason: { type: String, trim: true, maxlength: 500 },
  visibility: { type: String, enum: VISIBILITIES, default: 'visible' }, // quyết định của admin
  deletedAt: { type: Date, default: null }, // tác giả xóa
  publishedAt: { type: Date, default: null },
  // P1 cập nhật ba trường này trong transaction khi có đánh giá mới.
  ratingSum: { type: Number, default: 0, min: 0 },
  ratingCount: { type: Number, default: 0, min: 0 },
  ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
  // Chỉ dùng cho dữ liệu seed, để chạy seed lặp lại không tạo trùng.
  seedKey: { type: String },
}, { timestamps: true });

function fillDerivedFields(content) {
  if (!content) return;
  content.titleSearch = foldText(content.title);
  content.totalMinutes = (content.prepMinutes || 0) + (content.cookMinutes || 0);
  for (const item of content.ingredients) item.nameNormalized = normalizeText(item.name);
}

recipeSchema.pre('validate', async function fillSearchFields() {
  fillDerivedFields(this.published);
  fillDerivedFields(this.draft);
});

recipeSchema.index({ 'published.ingredients.nameNormalized': 1 });
recipeSchema.index({ 'published.category': 1 });
recipeSchema.index({ 'published.titleSearch': 1 });
recipeSchema.index({ moderationStatus: 1, updatedAt: -1 }); // hàng chờ duyệt
recipeSchema.index({ author: 1, updatedAt: -1 }); // công thức của tôi
recipeSchema.index({ ratingAverage: -1, ratingCount: -1 });
recipeSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

// Một món hiển thị công khai khi có bản published, admin không ẩn và tác giả chưa xóa.
// P1 (xếp hạng) và P3 (thực đơn, yêu thích) dùng chung bộ lọc này.
export function publicRecipeFilter() {
  return { published: { $ne: null }, visibility: 'visible', deletedAt: null };
}

export const Recipe = mongoose.model('Recipe', recipeSchema);
