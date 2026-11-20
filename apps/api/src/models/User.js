import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatar: String,
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

