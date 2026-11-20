import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIngredients } from '../src/utils/shoppingList.js';

test('gộp nguyên liệu trùng tên và đơn vị', () => {
  const result = mergeIngredients([
    { name: 'Trứng', unit: 'quả', quantity: 2 },
    { name: ' trứng ', unit: 'Quả', quantity: 3 },
    { name: 'Sữa', unit: 'ml', quantity: 100 },
  ]);
  assert.deepEqual(result, [
    { name: 'sữa', unit: 'ml', quantity: 100 },
    { name: 'trứng', unit: 'quả', quantity: 5 },
  ]);
});
