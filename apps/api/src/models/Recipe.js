import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, lowercase: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true, lowercase: true },
  note: { type: String, trim: true },
}, { _id: false });

const stepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  text: { type: String, required: true, trim: true },
  image: String,
  timerMinutes: { type: Number, min: 0, default: 0 },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120, index: 'text' },
  summary: { type: String, required: true, trim: true, maxlength: 320 },
  image: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  prepMinutes: { type: Number, required: true, min: 0 },
  cookMinutes: { type: Number, required: true, min: 1 },
  difficulty: { type: String, enum: ['Dễ', 'Vừa', 'Khó'], required: true, index: true },
  servings: { type: Number, required: true, min: 1, max: 50 },
  ingredients: { type: [ingredientSchema], validate: v => v.length > 0 },
  steps: { type: [stepSchema], validate: v => v.length > 0 },
  tags: [{ type: String, trim: true, lowercase: true }],
  status: { type: String, enum: ['pending', 'approved', 'hidden'], default: 'pending', index: true },
  ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  viewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

recipeSchema.index({ 'ingredients.name': 1 });
recipeSchema.index({ status: 1, viewCount: -1 });

export const Recipe = mongoose.model('Recipe', recipeSchema);

