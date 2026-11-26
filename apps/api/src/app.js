import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { loginRouter, protectWrites } from './features/auth/login.js';
import { catalogRouter } from './features/catalog/list.js';
import { errorHandler, notFound } from './middleware/error.js';

import { favoritesRouter } from './features/planner/favorites.js';
import { discoveryRouter } from './features/catalog/discovery.js';
import { meRecipesRouter, recipesWriteRouter } from './features/recipes/recipe.routes.js';
import { uploadsRouter, UPLOAD_DIR } from './features/uploads/upload.routes.js';

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
  app.use('/api/me/favorites', favoritesRouter);
  app.use('/api', discoveryRouter);
  app.use('/api/recipes', catalogRouter);
  app.use('/uploads', express.static(UPLOAD_DIR));
  app.use('/api/me/recipes', meRecipesRouter);
  app.use('/api/recipes', recipesWriteRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
