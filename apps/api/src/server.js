import { createApp } from './app.js';
import { config } from './config.js';

import { connectDb } from './db.js';
import { Review } from './models/Review.js';
import { User } from './models/User.js';

if (!config.jwtSecret || config.jwtSecret === 'replace-with-a-long-random-string') {
  throw new Error('Cần đặt JWT_SECRET riêng trong .env trước khi chạy API.');
}
await connectDb();
await Promise.all([User.init(), Review.init()]);
const host = process.env.HOST || '127.0.0.1';
createApp().listen(config.port, host, () => {
  console.log(`API: http://${host}:${config.port}/api/health`);
});
