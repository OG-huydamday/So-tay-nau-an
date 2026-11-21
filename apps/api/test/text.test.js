import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, foldText, slugify, escapeRegex } from '../src/utils/text.js';

test('normalizeText giữ dấu, gộp khoảng trắng và chữ thường', () => {
  assert.equal(normalizeText('  Cà   CHUA  '), 'cà chua');
  assert.equal(normalizeText(null), '');
});

test('normalizeText đưa dấu tổ hợp về cùng dạng NFC', () => {
  const composed = 'tr\u1ee9ng';
  const decomposed = 'tru\u031b\u0301ng';
  assert.equal(normalizeText(decomposed), composed);
});

test('foldText bỏ dấu và đổi đ thành d', () => {
  assert.equal(foldText('Gà kho gừng'), 'ga kho gung');
  assert.equal(foldText('Đậu hũ'), 'dau hu');
});

test('slugify tạo slug ổn định', () => {
  assert.equal(slugify('Canh - Súp'), 'canh-sup');
  assert.equal(slugify('  Món chay!  '), 'mon-chay');
});

test('escapeRegex chặn ký tự đặc biệt', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.ok(new RegExp(escapeRegex('(gà)')).test('món (gà)'));
});
