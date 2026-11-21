import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../../db.js';
import { User } from '../../models/User.js';

if (process.env.NODE_ENV === 'production') throw new Error('Seed demo chỉ dùng cho môi trường phát triển.');
try {
  await connectDb();
  await User.init();
  for (const [email, name, role] of [
    ['demo@example.test', 'Thành viên mẫu', 'member'],
    ['admin@example.test', 'Quản trị viên mẫu', 'admin'],
  ]) {
    const password = process.env[`DEMO_${role.toUpperCase()}_PASSWORD`] || randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await User.updateOne({ email }, { $setOnInsert: { name, role, passwordHash } }, { upsert: true });
    if (result.upsertedCount) console.log(`${email} — mật khẩu demo: ${password}`);
    else console.log(`${email} đã tồn tại, giữ nguyên tài khoản.`);
  }
} finally {
  await mongoose.disconnect();
}
