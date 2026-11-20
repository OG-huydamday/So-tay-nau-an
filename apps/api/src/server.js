import { createApp } from './app.js';
import { config } from './config.js';

// The scaffold can start before the team configures MongoDB.
createApp().listen(config.port, '127.0.0.1', () => {
  console.log(`API scaffold: http://127.0.0.1:${config.port}/api/health`);
});
