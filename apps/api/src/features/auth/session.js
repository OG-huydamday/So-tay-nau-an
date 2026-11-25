import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';

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

function cookieOptions() {
  return { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
}

export function startSession(res, user) {
  const csrf = randomBytes(32).toString('hex');
  const token = jwt.sign({ csrf }, config.jwtSecret, { subject: user.id, expiresIn: '8h' });
  const options = { ...cookieOptions(), maxAge: 8 * 60 * 60 * 1000 };
  res.cookie('session', token, { ...options, httpOnly: true });
  res.cookie('csrf', csrf, options);
}

export function clearSession(res) {
  res.clearCookie('session', { ...cookieOptions(), httpOnly: true });
  res.clearCookie('csrf', cookieOptions());
}
