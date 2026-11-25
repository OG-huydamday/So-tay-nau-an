import { z } from 'zod';

export const createReviewSchema = z.object({
  stars: z.number().int('Số sao phải là số nguyên.').min(1).max(5),
  comment: z.string().trim().min(1, 'Vui lòng nhập nội dung bình luận.').max(1000),
});

export const commentStatusSchema = z.object({
  commentStatus: z.enum(['visible', 'hidden']),
});

export function isObjectId(value) {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

export function parsePagination(query = {}) {
  const { page = '1', limit = '10' } = query;
  const isPosInt = (v) => typeof v === 'string' && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v));
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const offset = (pageNum - 1) * limitNum;

  if (!isPosInt(page) || !isPosInt(limit) || limitNum > 48 || !Number.isSafeInteger(offset)) {
    return null;
  }
  return { page: pageNum, limit: limitNum, offset };
}
