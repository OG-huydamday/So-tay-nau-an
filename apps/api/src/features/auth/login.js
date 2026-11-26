import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../../config.js';
import { User } from '../../models/User.js';
import { requireAuth } from '../../middleware/auth.js';
import { clearSession, readSession, startSession } from './session.js';

const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

const registration = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(8).refine(password => !bcrypt.truncates(password)),
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function protectWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== config.clientUrl) {
    return res.status(403).json({ code: 'INVALID_ORIGIN', message: 'Nguồn yêu cầu không hợp lệ.' });
  }
  // These routes create a fresh session and require JSON.
  if (req.method === 'POST' && ['/auth/login', '/auth/register'].includes(req.path)) return next();
  const session = readSession(req);
  if (session && (!session.csrf || req.get('x-csrf-token') !== session.csrf)) {
    return res.status(403).json({ code: 'INVALID_CSRF', message: 'Mã bảo vệ yêu cầu chưa đúng.' });
  }
  next();
}

export function loginRouter() {
  const router = Router();
  const attempts = new Map();
  let resetAt = 0;
  function limitAttempts(req, res, next) {
    const now = Date.now();
    if (now >= resetAt) {
      attempts.clear();
      resetAt = now + 15 * 60 * 1000;
    }
    const count = attempts.get(req.ip) || 0;
    if (count >= 20) {
      res.set('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
      return res.status(429).json({ code: 'RATE_LIMITED', message: 'Vui lòng thử lại sau.' });
    }
    attempts.set(req.ip, count + 1);
    next();
  }
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.post('/register', limitAttempts, async (req, res) => {
    const input = registration.safeParse(req.body);
    if (!req.is('application/json') || !input.success) {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'Nhập tên (tối đa 60 ký tự), email hợp lệ và mật khẩu từ 8 ký tự, tối đa 72 byte.' });
    }
    const { name, email, password } = input.data;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  });
  router.post('/login', limitAttempts, async (req, res) => {
    const { email, password } = req.body || {};
    if (!req.is('application/json') || typeof email !== 'string' || !email.trim()
      || typeof password !== 'string' || !password) {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'Cần nhập email và mật khẩu.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    const matches = await bcrypt.compare(password, user?.passwordHash || dummyHash);
    if (!matches || !user) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu chưa đúng.' });
    }
    startSession(res, user);
    res.json({ user: publicUser(user) });
  });
  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) });
  });
  router.post('/logout', (_req, res) => {
    clearSession(res);
    res.status(204).end();
  });
  return router;
}
