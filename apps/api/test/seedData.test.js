import test from 'node:test';
import assert from 'node:assert/strict';
import { seedCategories, seedRecipes } from '../src/features/catalog/seedData.js';
import { DIFFICULTIES, UNITS } from '../src/features/catalog/constants.js';
import { normalizeText } from '../src/utils/text.js';

const slugs = new Set(seedCategories.map((c) => c.slug));
const contents = seedRecipes.flatMap((r) => [r.published, r.draft].filter(Boolean));
const complete = seedRecipes.flatMap((r) => [r.published, r.moderationStatus === 'pending' ? r.draft : null].filter(Boolean));

test('seedKey và slug loại món không trùng nhau', () => {
  assert.equal(new Set(seedRecipes.map((r) => r.seedKey)).size, seedRecipes.length);
  assert.equal(slugs.size, seedCategories.length);
});

test('nội dung đủ trường dùng đúng loại món, độ khó và đơn vị hợp lệ', () => {
  for (const content of complete) {
    assert.ok(slugs.has(content.categorySlug), `${content.title}: loại món không tồn tại`);
    assert.ok(DIFFICULTIES.includes(content.difficulty), `${content.title}: độ khó sai`);
    assert.ok(content.ingredients.length > 0 && content.steps.length > 0, `${content.title}: thiếu nguyên liệu hoặc bước`);
    for (const item of content.ingredients) {
      if (item.quantityType === 'to-taste') continue;
      assert.ok(item.quantity > 0, `${content.title}/${item.name}: số lượng phải dương`);
      assert.ok(UNITS.includes(item.unit), `${content.title}/${item.name}: đơn vị "${item.unit}" không hợp lệ`);
    }
  }
});

test('một công thức không lặp tên nguyên liệu và các bước đánh số liên tục', () => {
  for (const content of contents.filter((c) => c.ingredients)) {
    const names = content.ingredients.map((i) => normalizeText(i.name));
    assert.equal(new Set(names).size, names.length, `${content.title}: trùng nguyên liệu`);
    content.steps.forEach((step, index) => assert.equal(step.order, index + 1));
  }
});

test('có đủ các trạng thái cần thử: công khai, ẩn, đã xóa, chờ duyệt, bị từ chối', () => {
  const has = (predicate) => seedRecipes.some(predicate);
  assert.ok(has((r) => r.published && !r.deleted && r.visibility !== 'hidden'));
  assert.ok(has((r) => r.visibility === 'hidden'));
  assert.ok(has((r) => r.deleted));
  assert.ok(has((r) => r.published && r.draft && r.moderationStatus === 'pending'));
  assert.ok(has((r) => !r.published && r.moderationStatus === 'pending'));
  assert.ok(has((r) => r.moderationStatus === 'rejected' && r.rejectReason));
});
