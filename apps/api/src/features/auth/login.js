import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';
import { User } from '../../models/User.js';

const sessionDuration = 8 * 60 * 60 * 1000;
const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);

export function readSession(req) {
  const cookie = req.headers.cookie?.split(';').map(value => value.trim())
    .find(value => value.startsWith('session='));
  if (!cookie) return null;
  try {
    return jwt.verify(cookie.slice('session='.length), config.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

export function protectWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== config.clientUrl) {
    return res.status(403).json({ code: 'INVALID_ORIGIN', message: 'Nguồn yêu cầu không hợp lệ.' });
  }
  // Login starts a new session and accepts JSON only.
  if (req.method === 'POST' && req.path === '/auth/login') return next();
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
  router.post('/login', async (req, res) => {
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
    const csrf = randomBytes(32).toString('hex');
    const token = jwt.sign({ csrf }, config.jwtSecret, { subject: user.id, expiresIn: '8h' });
    const options = { maxAge: sessionDuration, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
    res.cookie('session', token, { ...options, httpOnly: true });
    res.cookie('csrf', csrf, options);
    res.set('Cache-Control', 'no-store');
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
  return router;
}
