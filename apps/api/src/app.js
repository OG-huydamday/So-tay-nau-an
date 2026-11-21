import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { loginRouter, protectWrites } from './features/auth/login.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '128kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', stage: 'scaffold' });
  });

  app.use('/api', protectWrites);
  app.use('/api/auth', loginRouter());
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
