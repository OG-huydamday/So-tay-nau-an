import { createApp } from './app.js';
import { config } from './config.js';

import { connectDb } from './db.js';

if (!config.jwtSecret || config.jwtSecret === 'replace-with-a-long-random-string') {
  throw new Error('Cần đặt JWT_SECRET riêng trong .env trước khi chạy API.');
}
await connectDb();
createApp().listen(config.port, '127.0.0.1', () => {
  console.log(`API: http://127.0.0.1:${config.port}/api/health`);
});
