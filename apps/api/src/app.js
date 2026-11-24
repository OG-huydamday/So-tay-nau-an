import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { loginRouter, protectWrites } from './features/auth/login.js';
import { catalogRouter } from './features/catalog/list.js';
import { errorHandler, notFound } from './middleware/error.js';

import { favoritesRouter } from './features/planner/favorites.js';
import { discoveryRouter } from './features/catalog/discovery.js';
import { requireAuth } from './middleware/auth.js';

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
  app.get('/api/auth/me', requireAuth, (req, res) => {
    const {id,name,email,role} = req.user;
    res.set('Cache-Control','no-store').json({user:{id,name,email,role}});
  });
  app.use('/api/me/favorites', favoritesRouter);
  app.use('/api', discoveryRouter);
  app.use('/api/recipes', catalogRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
