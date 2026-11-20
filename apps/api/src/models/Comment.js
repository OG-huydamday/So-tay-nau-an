import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['visible', 'hidden'], default: 'visible' },
}, { timestamps: true });

export const Comment = mongoose.model('Comment', commentSchema);

