import { readSession } from '../features/auth/login.js';
import { User } from '../models/User.js';

export async function optionalAuth(req, _res, next) {
  const session = readSession(req);
  req.user = session ? await User.findById(session.sub) : null;
  next();
}

export async function requireAuth(req, res, next) {
  await optionalAuth(req, res, () => {});
  if (!req.user) return res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập để tiếp tục.' });
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ code: 'FORBIDDEN', message: 'Chỉ quản trị viên được thực hiện thao tác này.' });
  next();
}

