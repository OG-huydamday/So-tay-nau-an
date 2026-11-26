import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { detectImageMime } from '../src/features/uploads/imageSignature.js';

test('nhận ra JPEG, PNG, GIF, WEBP theo byte đầu', () => {
  assert.equal(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg');
  assert.equal(detectImageMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'image/png');
  assert.equal(detectImageMime(Buffer.from('GIF89a......')), 'image/gif');
  assert.equal(detectImageMime(Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ', 'latin1')), 'image/webp');
});

test('file giả ảnh (văn bản đổi đuôi) và file rỗng bị từ chối', () => {
  assert.equal(detectImageMime(Buffer.from('<?php echo 1; ?>')), null);
  assert.equal(detectImageMime(Buffer.from('hello world, not an image')), null);
  assert.equal(detectImageMime(Buffer.alloc(0)), null);
});
