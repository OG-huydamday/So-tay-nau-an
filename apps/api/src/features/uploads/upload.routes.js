import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { detectImageMime } from './imageSignature.js';
import { UPLOAD_DIR } from './uploadedImage.js';

export { UPLOAD_DIR };
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const multerUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      const err = new Error('Chỉ hỗ trợ file ảnh (JPEG, PNG, WEBP, GIF).');
      err.code = 'UNSUPPORTED_MEDIA_TYPE';
      return cb(err);
    }
    return cb(null, true);
  },
});

async function hasMatchingSignature(file) {
  const handle = await fs.promises.open(file.path, 'r');
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    return detectImageMime(head) === file.mimetype;
  } finally {
    await handle.close();
  }
}

export const uploadsRouter = Router();

uploadsRouter.post('/', requireAuth, (req, res, next) => {
  multerUpload.single('image')(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'File ảnh vượt quá dung lượng tối đa 5MB.',
          });
        }
        if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
          return res.status(415).json({ code: err.code, message: err.message });
        }
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            code: 'INVALID_INPUT',
            message: err.message || 'File tải lên không hợp lệ.',
          });
        }
        return next(err);
      }

      if (!req.file) {
        return res.status(400).json({
          code: 'INVALID_INPUT',
          message: 'Thiếu file ảnh tải lên (trường: image).',
        });
      }

      if (!(await hasMatchingSignature(req.file))) {
        await fs.promises.rm(req.file.path, { force: true });
        return res.status(415).json({
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Nội dung file không phải ảnh hợp lệ.',
        });
      }

      const url = `/uploads/${req.file.filename}`;
      return res.status(201).json({
        url,
        image: url,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      return next(error);
    }
  });
});
