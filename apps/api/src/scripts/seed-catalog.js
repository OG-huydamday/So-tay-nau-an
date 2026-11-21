import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import { User } from '../models/User.js';
import { seedCatalog } from '../features/catalog/seed.js';

// Trùng email với dữ liệu mẫu trong docs/fixtures để P1 và P3 dùng chung một tài khoản.
const DEMO_EMAIL = 'demo@example.test';

async function findOrCreateAuthor() {
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) return existing;
  console.warn(`Chưa có tài khoản ${DEMO_EMAIL}. Tạo tạm tác giả mẫu, tài khoản này chưa đăng nhập được cho đến khi seed tài khoản của P1 chạy.`);
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  return User.create({ name: 'Thành viên mẫu', email: DEMO_EMAIL, passwordHash });
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('Không seed ở production. Đặt ALLOW_SEED=true nếu thật sự cần.');
  process.exit(1);
}

try {
  await connectDb();
  const author = await findOrCreateAuthor();
  console.log('Đã seed:', await seedCatalog({ authorId: author._id }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
