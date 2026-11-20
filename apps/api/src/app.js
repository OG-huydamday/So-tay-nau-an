import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientUrl }));
  app.use(express.json({ limit: '128kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', stage: 'scaffold' });
  });

  // Each owner mounts their feature router here after review.
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
