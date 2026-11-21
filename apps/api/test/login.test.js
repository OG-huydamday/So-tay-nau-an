import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { connectDb } from '../src/db.js';

test('đăng nhập với tài khoản demo và kiểm tra cookie phiên', {
  skip: process.env.TEST_DEMO_LOGIN !== '1' && 'Cần MongoDB demo đã seed.',
}, async t => {
  const fixture = JSON.parse(await readFile(new URL('../../../docs/fixtures/kickoff.json', import.meta.url)));
  await connectDb();
  t.after(() => mongoose.disconnect());
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const endpoint = `http://127.0.0.1:${server.address().port}/api/auth/login`;
  function login(email, password, origin = config.clientUrl) {
    return globalThis.fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', origin },
      body: JSON.stringify({ email, password }),
    });
  }
  for (const [email, role, password] of [
    ['demo@example.test', 'member', process.env.DEMO_MEMBER_PASSWORD],
    ['admin@example.test', 'admin', process.env.DEMO_ADMIN_PASSWORD],
  ]) {
    assert.ok(password, 'Cần đặt mật khẩu demo trong .env để thử.');
    const response = await login(email.toUpperCase(), password);
    assert.equal(response.status, 200);
    const { user } = await response.json();
    assert.deepEqual(Object.keys(user).sort(), Object.keys(fixture.loginSuccess.user).sort());
    assert.equal(user.email, email);
    assert.equal(user.role, role);
    const cookies = response.headers.getSetCookie();
    assert.match(cookies.find(cookie => cookie.startsWith('session=')), /HttpOnly/i);
    assert.match(cookies.find(cookie => cookie.startsWith('session=')), /SameSite=Lax/i);
    assert.ok(cookies.some(cookie => cookie.startsWith('csrf=')));
  }
  for (const email of ['demo@example.test', 'missing@example.test']) {
    const response = await login(email, 'invalid-demo-password');
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), fixture.loginError);
    assert.equal(response.headers.getSetCookie().length, 0);
  }
  assert.equal((await login({}, 'test')).status, 400);
  assert.equal((await login('demo@example.test', 'test', 'https://other.example')).status, 403);
});
