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
import { uploadedImageName } from '../src/features/uploads/uploadedImage.js';
import { Category } from '../src/models/Category.js';
import { Recipe } from '../src/models/Recipe.js';
import { User } from '../src/models/User.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const SOME_ID = '507f1f77bcf86cd799439011';

test('uploadedImageName chỉ nhận URL ảnh do server cấp', () => {
  assert.equal(uploadedImageName('/uploads/1732780000000-0123456789ab.png'), '1732780000000-0123456789ab.png');
  assert.equal(uploadedImageName('/uploads/1732780000000-0123456789ab.webp'), '1732780000000-0123456789ab.webp');
  for (const bad of [
    null, undefined, 42, '',
    'https://example.test/uploads/1732780000000-0123456789ab.png',
    '//example.test/uploads/1732780000000-0123456789ab.png',
    '/uploads/../.env',
    '/uploads/a.png',
    '/uploads/1732780000000-0123456789ab.svg',
    '/uploads/1732780000000-0123456789ab.png/extra',
    'javascript:alert(1)',
  ]) {
    assert.equal(uploadedImageName(bad), null, String(bad));
  }
});

test('route duyệt món chặn khách chưa đăng nhập', async t => {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/admin/recipes`;
  for (const [route, method] of [
    ['', 'GET'],
    [`/${SOME_ID}`, 'GET'],
    [`/${SOME_ID}/review`, 'POST'],
    [`/${SOME_ID}/visibility`, 'PATCH'],
  ]) {
    const response = await globalThis.fetch(base + route, { method });
    assert.equal(response.status, 401, `${method} ${route}`);
  }
});

async function start(t) {
  await connectDb();
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const created = { accounts: [], recipes: [], files: [] };
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    await Recipe.deleteMany({ _id: { $in: created.recipes } });
    await User.deleteMany({ _id: { $in: created.accounts } });
    await Promise.all(created.files.map(name => rm(path.join(UPLOAD_DIR, name), { force: true })));
    await mongoose.disconnect();
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function makeUser(role = 'member') {
    const user = await User.create({
      name: `Test ${role}`, email: `${randomUUID()}@example.test`, passwordHash: 'test-only', role,
    });
    created.accounts.push(user._id);
    const csrf = randomUUID();
    const token = jwt.sign({ sub: user.id, csrf }, config.jwtSecret, { expiresIn: '5m' });
    return { id: user.id, email: user.email, headers: { cookie: `session=${token}`, 'x-csrf-token': csrf } };
  }

  async function call(route, { method = 'GET', as, body, form } = {}) {
    const headers = { ...as?.headers };
    if (body) headers['content-type'] = 'application/json';
    const response = await globalThis.fetch(base + route, {
      method, headers, body: form ?? (body ? JSON.stringify(body) : undefined),
    });
    const type = response.headers.get('content-type') || '';
    return { status: response.status, data: type.includes('json') ? await response.json() : null };
  }

  const category = await Category.findOne();
  assert.ok(category, 'Cần seed loại món: npm run seed:catalog -w @bep-nha/api');
  return { call, makeUser, created, category };
}

test('Duyệt món: hàng chờ, duyệt/từ chối đúng draftVersion, 409 khi lệch, ẩn/hiện món', {
  skip: process.env.TEST_DEMO_CATALOG !== '1' && 'Cần MongoDB demo đã seed danh mục.',
}, async t => {
  const { call, makeUser, created, category } = await start(t);
  const [author, member, admin] = [await makeUser(), await makeUser(), await makeUser('admin')];
  const title = `Món duyệt ${randomUUID().slice(0, 8)}`;

  const created1 = await call('/api/recipes', { method: 'POST', as: author, body: { title } });
  assert.equal(created1.status, 201);
  const id = created1.data.id;
  created.recipes.push(id);
  const filled = await call(`/api/recipes/${id}`, {
    method: 'PUT',
    as: author,
    body: {
      summary: 'Món thử cho kiểm thử duyệt.',
      category: String(category._id),
      prepMinutes: 5,
      cookMinutes: 10,
      difficulty: 'Dễ',
      servings: 2,
      ingredients: [{ name: 'Trứng', quantity: 2, unit: 'quả' }, { name: 'Muối', quantityType: 'to-taste' }],
      steps: [{ text: 'Đánh trứng và chiên chín.' }],
    },
  });
  assert.equal(filled.status, 200);
  const submitted = await call(`/api/recipes/${id}/submit`, { method: 'POST', as: author });
  assert.equal(submitted.status, 200);
  const version = submitted.data.draftVersion;
  const publicStatus = async () => (await call(`/api/recipes/${id}`)).status;

  assert.equal((await call('/api/admin/recipes', { as: member })).status, 403);
  assert.equal((await call(`/api/admin/recipes/${id}/review`, { method: 'POST', as: member, body: { action: 'approve', version } })).status, 403);
  assert.equal((await call(`/api/admin/recipes/${id}/visibility`, { method: 'PATCH', as: member, body: { visibility: 'hidden' } })).status, 403);

  assert.equal((await call('/api/admin/recipes?status=oops', { as: admin })).status, 400);
  assert.equal((await call('/api/admin/recipes?limit=49', { as: admin })).status, 400);
  // Hàng chờ sắp cũ trước, nên món mới có thể nằm ở trang sau nếu DB demo còn nhiều món chờ.
  let row;
  for (let page = 1; !row; page += 1) {
    const queue = await call(`/api/admin/recipes?status=pending&limit=48&page=${page}`, { as: admin });
    assert.equal(queue.status, 200);
    row = queue.data.items.find(item => item.id === id);
    if (queue.data.items.length < 48) break;
  }
  assert.ok(row, 'món vừa gửi phải nằm trong hàng chờ');
  assert.equal(row.title, title);
  assert.equal(row.author.id, author.id);
  assert.equal(row.draftVersion, version);
  assert.equal(row.hasPublished, false);
  const detail = await call(`/api/admin/recipes/${id}`, { as: admin });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.draft.title, title);
  assert.equal(detail.data.draft.category.name, category.name);
  assert.equal(detail.data.author.email, author.email);
  assert.equal(detail.data.published, null);
  assert.equal((await call('/api/admin/recipes/bad-id', { as: admin })).status, 400);
  assert.equal((await call(`/api/admin/recipes/${SOME_ID}`, { as: admin })).status, 404);

  const review = body => call(`/api/admin/recipes/${id}/review`, { method: 'POST', as: admin, body });
  assert.equal((await review({ action: 'maybe', version })).status, 400);
  assert.equal((await review({ action: 'approve' })).status, 400);
  assert.equal((await review({ action: 'approve', version: 1.5 })).status, 400);
  const noReason = await review({ action: 'reject', version });
  assert.equal(noReason.status, 400);
  assert.equal(noReason.data.message, 'Cần ghi lý do từ chối.');
  assert.equal((await review({ action: 'reject', version, reason: '   ' })).status, 400);

  const stale = await review({ action: 'approve', version: version + 1 });
  assert.equal(stale.status, 409);
  assert.equal(stale.data.code, 'CONFLICT');
  assert.equal(await publicStatus(), 404);

  const rejected = await review({ action: 'reject', version, reason: 'Thiếu ảnh minh họa.' });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.data.moderationStatus, 'rejected');
  assert.equal(rejected.data.rejectReason, 'Thiếu ảnh minh họa.');
  assert.equal((await call(`/api/me/recipes/${id}`, { as: author })).data.rejectReason, 'Thiếu ảnh minh họa.');
  assert.equal(await publicStatus(), 404);
  assert.equal((await review({ action: 'approve', version })).status, 409, 'không còn chờ duyệt');

  const edited = await call(`/api/recipes/${id}`, { method: 'PUT', as: author, body: { summary: 'Đã bổ sung mô tả.' } });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.draftVersion, version + 1);
  assert.equal(edited.data.rejectReason, undefined);
  const resubmitted = await call(`/api/recipes/${id}/submit`, { method: 'POST', as: author });
  assert.equal(resubmitted.status, 200);
  const next = resubmitted.data.draftVersion;
  assert.equal(next, version + 1);
  assert.equal((await review({ action: 'approve', version })).status, 409);
  assert.equal(await publicStatus(), 404);

  const approved = await review({ action: 'approve', version: next });
  assert.equal(approved.status, 200);
  assert.equal(approved.data.moderationStatus, 'approved');
  assert.equal(approved.data.publishedVersion, 1);
  assert.equal((await review({ action: 'approve', version: next })).status, 409, 'duyệt lặp');
  const publicRecipe = await call(`/api/recipes/${id}`);
  assert.equal(publicRecipe.status, 200);
  assert.equal(publicRecipe.data.title, title);
  assert.equal(publicRecipe.data.summary, 'Đã bổ sung mô tả.');
  assert.equal(publicRecipe.data.totalMinutes, 15);
  const afterApprove = await call(`/api/admin/recipes/${id}`, { as: admin });
  assert.equal(afterApprove.data.draft, null);
  assert.equal(afterApprove.data.published.title, title);
  assert.ok(afterApprove.data.publishedAt);

  const visibility = (as, body) => call(`/api/admin/recipes/${id}/visibility`, { method: 'PATCH', as, body });
  assert.equal((await visibility(admin, { visibility: 'deleted' })).status, 400);
  assert.equal((await visibility(admin, {})).status, 400);
  assert.equal((await visibility(admin, { visibility: 'hidden' })).data.visibility, 'hidden');
  assert.equal(await publicStatus(), 404);
  assert.equal((await visibility(admin, { visibility: 'visible' })).data.visibility, 'visible');
  assert.equal(await publicStatus(), 200);
  assert.equal((await call(`/api/admin/recipes/${SOME_ID}/visibility`, { method: 'PATCH', as: admin, body: { visibility: 'hidden' } })).status, 404);

  const newTitle = `${title} (sửa)`;
  const reEdit = await call(`/api/recipes/${id}`, { method: 'PUT', as: author, body: { title: newTitle } });
  assert.equal(reEdit.status, 200);
  assert.equal(reEdit.data.moderationStatus, 'draft');
  assert.equal((await call(`/api/recipes/${id}`)).data.title, title);
  const reSubmit = await call(`/api/recipes/${id}/submit`, { method: 'POST', as: author });
  assert.equal(reSubmit.status, 200);
  const reApproved = await review({ action: 'approve', version: reSubmit.data.draftVersion });
  assert.equal(reApproved.status, 200);
  assert.equal(reApproved.data.publishedVersion, 2);
  assert.equal((await call(`/api/recipes/${id}`)).data.title, newTitle);
  assert.equal((await call(`/api/admin/recipes/${id}`, { as: admin })).data.publishedAt, afterApprove.data.publishedAt);

  assert.equal((await call(`/api/recipes/${id}`, { method: 'DELETE', as: author })).status, 200);
  assert.equal((await call(`/api/admin/recipes/${id}`, { as: admin })).status, 404);
  assert.equal((await visibility(admin, { visibility: 'hidden' })).status, 404);
});

test('Ảnh công thức chỉ nhận ảnh đã tải lên qua /api/uploads', {
  skip: process.env.TEST_DEMO_CATALOG !== '1' && 'Cần MongoDB demo đã seed danh mục.',
}, async t => {
  const { call, makeUser, created } = await start(t);
  const owner = await makeUser();
  const made = await call('/api/recipes', { method: 'POST', as: owner, body: { title: 'Món có ảnh' } });
  assert.equal(made.status, 201);
  const id = made.data.id;
  created.recipes.push(id);

  const put = body => call(`/api/recipes/${id}`, { method: 'PUT', as: owner, body });
  for (const bad of [
    'https://example.test/a.png',
    '/uploads/../.env',
    '/uploads/1732780000000-0123456789ab.png',
    'javascript:alert(1)',
  ]) {
    const response = await put({ image: bad });
    assert.equal(response.status, 400, bad);
    assert.equal(response.data.code, 'INVALID_INPUT');
  }
  assert.equal((await put({ steps: [{ text: 'Bước 1', image: 'https://example.test/b.png' }] })).status, 400);
  assert.equal((await call('/api/recipes', {
    method: 'POST', as: owner, body: { title: 'Ảnh ngoài', image: 'https://example.test/a.png' },
  })).status, 400);

  const form = new globalThis.FormData();
  form.append('image', new globalThis.Blob([PNG], { type: 'image/png' }), 'ok.png');
  const upload = await call('/api/uploads', { method: 'POST', as: owner, form });
  assert.equal(upload.status, 201);
  created.files.push(upload.data.filename);

  const good = await put({ image: upload.data.url, steps: [{ text: 'Bước 1', image: upload.data.url }] });
  assert.equal(good.status, 200);
  assert.equal(good.data.draft.image, upload.data.url);
  assert.equal(good.data.draft.steps[0].image, upload.data.url);
  assert.equal((await put({ image: upload.data.url, summary: 'Cập nhật mô tả.' })).status, 200);
  const cleared = await put({ image: null });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.data.draft.image, null);
});
