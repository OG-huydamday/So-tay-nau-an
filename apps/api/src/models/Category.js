import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  icon: { type: String, default: '🍲' },
  color: { type: String, default: '#d95d39' },
}, { timestamps: true });

export const Category = mongoose.model('Category', categorySchema);

