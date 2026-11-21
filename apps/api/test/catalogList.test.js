import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/db.js';
import { Recipe } from '../src/models/Recipe.js';
import { seedRecipes } from '../src/features/catalog/seedData.js';

test('danh sách công khai chỉ trả bản published đúng fixture và phân trang ổn định', {
  skip: process.env.TEST_DEMO_CATALOG !== '1' && 'Cần MongoDB demo đã seed danh mục.',
}, async t => {
  await connectDb();
  t.after(() => mongoose.disconnect());
  const fixture = JSON.parse(await readFile(new URL('../../../docs/fixtures/kickoff.json', import.meta.url)));
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/recipes`;
  const all = [];
  let page = 0;
  let total;
  do {
    page++;
    const response = await globalThis.fetch(`${url}?page=${page}&limit=3`);
    assert.equal(response.status, 200);
    const list = await response.json();
    assert.equal(list.page, page);
    assert.equal(list.limit, 3);
    total = list.total;
    all.push(...list.items);
  } while (page * 3 < total);
  const byId = new Map(all.map(item => [item.id, item]));
  assert.equal(byId.size, total);
  for (const seed of seedRecipes) {
    const recipe = await Recipe.findOne({ seedKey: seed.seedKey });
    assert.ok(recipe, seed.seedKey);
    const card = byId.get(recipe.id);
    if (seed.published && seed.visibility !== 'hidden' && !seed.deleted) {
      assert.equal(card.title, seed.published.title);
      assert.deepEqual(Object.keys(card).sort(), Object.keys(fixture.recipeList.items[0]).sort());
      assert.deepEqual(Object.keys(card.category).sort(), ['id', 'name']);
    } else {
      assert.equal(card, undefined);
    }
  }
  assert.equal((await globalThis.fetch(`${url}?limit=49`)).status, 400);
  assert.equal((await globalThis.fetch(`${url}?page=0`)).status, 400);
});
