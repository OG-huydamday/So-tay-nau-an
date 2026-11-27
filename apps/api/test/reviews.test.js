import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { connectDb } from '../src/db.js';
import { commentStatusSchema, createReviewSchema, isObjectId, parsePagination } from '../src/features/reviews/schema.js';
import { Recipe, publicRecipeFilter } from '../src/models/Recipe.js';
import { Review } from '../src/models/Review.js';
import { User } from '../src/models/User.js';

test('schema đánh giá chỉ nhận sao nguyên 1–5 và bình luận không rỗng', () => {
  assert.equal(createReviewSchema.safeParse({ stars: 5, comment: 'Rất ngon!' }).success, true);
  assert.equal(createReviewSchema.safeParse({ stars: 1, comment: 'Hơi mặn' }).success, true);
  assert.equal(createReviewSchema.safeParse({ stars: 0, comment: 'Không hợp lệ' }).success, false);
  assert.equal(createReviewSchema.safeParse({ stars: 6, comment: 'Quá 5' }).success, false);
  assert.equal(createReviewSchema.safeParse({ stars: 3.5, comment: 'Không nguyên' }).success, false);
  assert.equal(createReviewSchema.safeParse({ stars: 4, comment: '   ' }).success, false);
  assert.equal(createReviewSchema.safeParse({ stars: 4 }).success, false);
});

test('schema trạng thái bình luận và phân trang kiểm tra đầu vào đúng chuẩn', () => {
  assert.equal(commentStatusSchema.safeParse({ commentStatus: 'visible' }).success, true);
  assert.equal(commentStatusSchema.safeParse({ commentStatus: 'hidden' }).success, true);
  assert.equal(commentStatusSchema.safeParse({ commentStatus: 'deleted' }).success, false);

  assert.deepEqual(parsePagination({ page: '2', limit: '10' }), { page: 2, limit: 10, offset: 10 });
  assert.equal(parsePagination({ page: '0', limit: '10' }), null);
  assert.equal(parsePagination({ page: '1', limit: '49' }), null);
  assert.equal(isObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isObjectId('bad-id'), false);
});

test('route đánh giá và quản trị chặn ID sai hoặc chưa đăng nhập', async t => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));

  const base = `http://127.0.0.1:${server.address().port}/api`;
  const badList = await globalThis.fetch(`${base}/recipes/bad-id/reviews`);
  assert.equal(badList.status, 400);
  assert.equal((await badList.json()).code, 'INVALID_INPUT');

  const unauthPost = await globalThis.fetch(`${base}/recipes/507f1f77bcf86cd799439011/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stars: 5, comment: 'Ngon' }),
  });
  assert.equal(unauthPost.status, 401);

  for (const [path, method] of [
    ['/admin/reviews', 'GET'],
    ['/admin/reviews/507f1f77bcf86cd799439011/comment-status', 'PATCH'],
    ['/admin/stats/top-recipes', 'GET'],
  ]) {
    const res = await globalThis.fetch(`${base}${path}`, { method });
    assert.equal(res.status, 401);
  }
});

test('gửi đánh giá trong transaction, chống trùng đồng thời, ẩn bình luận giữ điểm sao và xếp hạng', {
  skip: process.env.TEST_DEMO_CATALOG !== '1' && 'Cần MongoDB replica set đã seed danh mục.',
}, async t => {
  await connectDb();
  await Promise.all([User.init(), Review.init()]);
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');

  const createdUserIds = [];
  const createdReviewIds = [];
  let targetRecipeSnapshot = null;

  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (createdReviewIds.length) {
      await Review.deleteMany({ _id: { $in: createdReviewIds } });
    }
    if (createdUserIds.length) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    if (targetRecipeSnapshot) {
      await Recipe.findByIdAndUpdate(targetRecipeSnapshot.id, {
        $set: {
          ratingSum: targetRecipeSnapshot.ratingSum,
          ratingCount: targetRecipeSnapshot.ratingCount,
          ratingAverage: targetRecipeSnapshot.ratingAverage,
        },
      });
    }
    await mongoose.disconnect();
  });

  const recipe = await Recipe.findOne(publicRecipeFilter()).lean();
  assert.ok(recipe, 'Cần ít nhất 1 công thức công khai để kiểm thử đánh giá.');
  targetRecipeSnapshot = {
    id: recipe._id,
    ratingSum: recipe.ratingSum || 0,
    ratingCount: recipe.ratingCount || 0,
    ratingAverage: recipe.ratingAverage || 0,
  };

  const makeAuthHeaders = async (role = 'member') => {
    const user = await User.create({
      name: `Test ${role}`,
      email: `${randomUUID()}@example.test`,
      passwordHash: 'test-only',
      role,
    });
    createdUserIds.push(user._id);
    const csrf = randomUUID();
    const token = jwt.sign({ csrf }, config.jwtSecret, { subject: user.id, expiresIn: '5m' });
    return {
      cookie: `session=${token}`,
      'x-csrf-token': csrf,
      'Content-Type': 'application/json',
    };
  };

  const [member1, member2, admin] = await Promise.all([
    makeAuthHeaders('member'),
    makeAuthHeaders('member'),
    makeAuthHeaders('admin'),
  ]);

  const base = `http://127.0.0.1:${server.address().port}/api`;
  const reviewUrl = `${base}/recipes/${recipe._id}/reviews`;

  // Ca T06: Hai request đồng thời từ cùng một user -> 1 thành công (201), 1 xung đột (409)
  const concurrent = await Promise.all([
    globalThis.fetch(reviewUrl, {
      method: 'POST',
      headers: member1,
      body: JSON.stringify({ stars: 5, comment: 'Rất vừa miệng!' }),
    }),
    globalThis.fetch(reviewUrl, {
      method: 'POST',
      headers: member1,
      body: JSON.stringify({ stars: 4, comment: 'Gửi trùng' }),
    }),
  ]);
  const statuses = concurrent.map(r => r.status).sort();
  assert.deepEqual(statuses, [201, 409]);

  for (const res of concurrent) {
    const body = await res.json();
    if (res.status === 201) {
      createdReviewIds.push(body.review.id);
    } else {
      assert.equal(body.code, 'REVIEW_ALREADY_EXISTS');
    }
  }

  // User thứ 2 đánh giá 3 sao
  const secondRes = await globalThis.fetch(reviewUrl, {
    method: 'POST',
    headers: member2,
    body: JSON.stringify({ stars: 3, comment: 'Tạm ổn.' }),
  });
  assert.equal(secondRes.status, 201);
  const secondBody = await secondRes.json();
  createdReviewIds.push(secondBody.review.id);

  const expectedSum = targetRecipeSnapshot.ratingSum + 8;
  const expectedCount = targetRecipeSnapshot.ratingCount + 2;
  const expectedAvg = Math.round((expectedSum / expectedCount) * 100) / 100;
  assert.equal(secondBody.ratingCount, expectedCount);
  assert.equal(secondBody.ratingAverage, expectedAvg);

  // Ca T02: Member gọi route admin bị từ chối 403
  assert.equal((await globalThis.fetch(`${base}/admin/reviews`, { headers: member1 })).status, 403);
  assert.equal((await globalThis.fetch(`${base}/admin/stats/top-recipes`, { headers: member1 })).status, 403);

  // Ca T07: Admin ẩn bình luận của user 2, tổng sao và trung bình không thay đổi
  const hideRes = await globalThis.fetch(`${base}/admin/reviews/${secondBody.review.id}/comment-status`, {
    method: 'PATCH',
    headers: admin,
    body: JSON.stringify({ commentStatus: 'hidden' }),
  });
  assert.equal(hideRes.status, 200);
  assert.equal((await hideRes.json()).commentStatus, 'hidden');

  const publicList = await (await globalThis.fetch(reviewUrl)).json();
  assert.ok(publicList.items.some(item => item.id === createdReviewIds[0]));
  assert.ok(!publicList.items.some(item => item.id === secondBody.review.id));

  const updatedRecipe = await Recipe.findById(recipe._id).lean();
  assert.equal(updatedRecipe.ratingCount, expectedCount);
  assert.equal(updatedRecipe.ratingAverage, expectedAvg);

  // Xếp hạng món công khai
  const topRes = await globalThis.fetch(`${base}/admin/stats/top-recipes`, { headers: admin });
  assert.equal(topRes.status, 200);
  const topList = await topRes.json();
  assert.ok(topList.items.some(item => String(item.id) === String(recipe._id)));
});
