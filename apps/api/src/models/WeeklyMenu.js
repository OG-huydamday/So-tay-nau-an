import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
  day: { type: Number, min: 0, max: 6, required: true },
  slot: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  servings: { type: Number, min: 1, default: 2 },
}, { _id: false });

const weeklyMenuSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  meals: [mealSchema],
}, { timestamps: true });

export const WeeklyMenu = mongoose.model('WeeklyMenu', weeklyMenuSchema);

