import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { connectDb } from '../src/db.js';
import { UPLOAD_DIR } from '../src/features/uploads/upload.routes.js';
import { Category } from '../src/models/Category.js';
import { Recipe } from '../src/models/Recipe.js';
import { User } from '../src/models/User.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

test('Công thức của tôi: nháp, quyền chủ món, gửi duyệt và tải ảnh', {
  skip: process.env.TEST_DEMO_CATALOG !== '1' && 'Cần MongoDB demo đã seed danh mục.',
}, async t => {
  await connectDb();
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const accounts = [];
  const recipes = [];
  const files = [];
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await Recipe.deleteMany({ _id: { $in: recipes } });
    await User.deleteMany({ _id: { $in: accounts } });
    await Promise.all(files.map(name => rm(path.join(UPLOAD_DIR, name), { force: true })));
    await mongoose.disconnect();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const category = await Category.findOne();
  assert.ok(category, 'Cần seed loại món: npm run seed:catalog -w @bep-nha/api');

  async function makeUser() {
    const user = await User.create({ name: 'Test P2', email: `${randomUUID()}@example.test`, passwordHash: 'test-only' });
    accounts.push(user._id);
    const csrf = randomUUID();
    const token = jwt.sign({ sub: user.id, csrf }, config.jwtSecret, { expiresIn: '2m' });
    return { cookie: `session=${token}`, 'x-csrf-token': csrf };
  }
  async function call(route, { method = 'GET', user, body, form } = {}) {
    const headers = { ...user };
    if (body) headers['content-type'] = 'application/json';
    const response = await globalThis.fetch(base + route, {
      method, headers, body: form ?? (body ? JSON.stringify(body) : undefined),
    });
    const type = response.headers.get('content-type') || '';
    return { status: response.status, data: type.includes('json') ? await response.json() : null };
  }
  const owner = await makeUser();
  const other = await makeUser();

  assert.equal((await call('/api/recipes', { method: 'POST', body: { title: 'Món thử' } })).status, 401);

  const created = await call('/api/recipes', { method: 'POST', user: owner, body: { title: 'Món thử P2' } });
  assert.equal(created.status, 201);
  const id = created.data.id;
  recipes.push(id);
  assert.equal(created.data.moderationStatus, 'draft');
  assert.equal(created.data.draft.title, 'Món thử P2');

  for (const [method, route] of [['PUT', `/api/recipes/${id}`], ['DELETE', `/api/recipes/${id}`], ['GET', `/api/me/recipes/${id}`]]) {
    const denied = await call(route, { method, user: other, body: method === 'PUT' ? { title: 'Chiếm quyền' } : undefined });
    assert.equal(denied.status, 403, `${method} ${route}`);
    assert.equal(denied.data.code, 'FORBIDDEN');
  }

  const incomplete = await call(`/api/recipes/${id}/submit`, { method: 'POST', user: owner });
  assert.equal(incomplete.status, 400);
  assert.equal(incomplete.data.code, 'INVALID_INPUT');

  const edited = await call(`/api/recipes/${id}`, {
    method: 'PUT',
    user: owner,
    body: {
      summary: 'Món thử cho kiểm thử.',
      category: String(category._id),
      prepMinutes: 5,
      cookMinutes: 10,
      difficulty: 'Dễ',
      servings: 2,
      ingredients: [{ name: 'Trứng', quantity: 2, unit: 'quả' }, { name: 'Muối', quantityType: 'to-taste' }],
      steps: [{ text: 'Đánh trứng và chiên chín.' }],
    },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.draftVersion, 2);
  assert.equal(edited.data.draft.title, 'Món thử P2');

  const submitted = await call(`/api/recipes/${id}/submit`, { method: 'POST', user: owner });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.data.moderationStatus, 'pending');
  assert.equal((await call(`/api/recipes/${id}`, { method: 'PUT', user: owner, body: { title: 'Sửa khi đang chờ' } })).status, 409);

  const mine = await call('/api/me/recipes', { user: owner });
  assert.ok(mine.data.items.some(item => item.id === id));
  assert.ok(!(await call('/api/me/recipes', { user: other })).data.items.some(item => item.id === id));
  assert.equal((await call(`/api/recipes/${id}`)).status, 404);

  const upload = (blob, name) => {
    const form = new globalThis.FormData();
    form.append('image', blob, name);
    return call('/api/uploads', { method: 'POST', user: owner, form });
  };
  const fake = await upload(new globalThis.Blob(['đây là văn bản'], { type: 'image/png' }), 'fake.png');
  assert.equal(fake.status, 415);
  const large = await upload(new globalThis.Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'large.png');
  assert.equal(large.status, 413);
  const good = await upload(new globalThis.Blob([PNG], { type: 'image/png' }), 'ok.png');
  assert.equal(good.status, 201);
  files.push(good.data.filename);
  assert.ok(good.data.url.startsWith('/uploads/'));
  assert.equal((await globalThis.fetch(base + good.data.url)).status, 200);
});
