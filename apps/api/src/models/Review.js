import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Số sao đánh giá phải là số nguyên từ 1 đến 5.',
    },
  },
  comment: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 },
  commentStatus: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
}, { timestamps: true });

reviewSchema.index({ recipe: 1, user: 1 }, { unique: true });
reviewSchema.index({ recipe: 1, commentStatus: 1, createdAt: -1 });
reviewSchema.index({ commentStatus: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
