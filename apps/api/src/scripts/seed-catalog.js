import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import { User } from '../models/User.js';
import { seedCatalog } from '../features/catalog/seed.js';

// Trùng email với dữ liệu mẫu trong docs/fixtures để P1 và P3 dùng chung một tài khoản.
const DEMO_EMAIL = 'demo@example.test';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error('Không seed ở production. Đặt ALLOW_SEED=true nếu thật sự cần.');
  process.exit(1);
}

try {
  await connectDb();
  const author = await User.findOne({ email: DEMO_EMAIL });
  if (!author) throw new Error('Chạy npm run seed:accounts từ thư mục gốc để tạo tác giả demo trước.');
  console.log('Đã seed:', await seedCatalog({ authorId: author._id }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
