import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { loginRouter, protectWrites } from './features/auth/login.js';
import { catalogRouter } from './features/catalog/list.js';
import { adminReviewsRouter, reviewsRouter } from './features/reviews/routes.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.clientUrl, credentials: true }));
  app.use(express.json({ limit: '128kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', stage: 'scaffold' });
  });

  app.use('/api', protectWrites);
  app.use('/api/auth', loginRouter());
  app.use('/api/recipes/:id/reviews', reviewsRouter);
  app.use('/api/admin', adminReviewsRouter);
  app.use('/api/recipes', catalogRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
