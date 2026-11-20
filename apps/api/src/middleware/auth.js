import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export async function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = await User.findById(payload.sub);
  } catch {
    req.user = null;
  }
  next();
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {});
  if (!req.user) return res.status(401).json({ message: 'Bạn cần đăng nhập để tiếp tục.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Chỉ quản trị viên được thực hiện thao tác này.' });
  next();
}

