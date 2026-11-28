import fs from 'node:fs/promises';
import path from 'node:path';

export const UPLOAD_DIR = path.resolve(import.meta.dirname, '../../../uploads');

const UPLOAD_URL = /^\/uploads\/(\d{10,15}-[0-9a-f]{12}\.(?:jpg|png|webp|gif))$/;

export function uploadedImageName(value) {
  const match = typeof value === 'string' ? UPLOAD_URL.exec(value) : null;
  return match ? match[1] : null;
}

export async function uploadedImageExists(value) {
  const name = uploadedImageName(value);
  if (!name) return false;
  try {
    await fs.access(path.join(UPLOAD_DIR, name));
    return true;
  } catch {
    return false;
  }
}
