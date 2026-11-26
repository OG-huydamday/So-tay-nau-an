import test from 'node:test';
import assert from 'node:assert/strict';
import { toOwnerView } from '../src/features/recipes/ownerView.js';

test('toOwnerView đổi _id thành id và bỏ trường nội bộ', () => {
  const view = toOwnerView({
    _id: 'abc123', __v: 2, seedKey: 'x', moderationStatus: 'draft', draftVersion: 3, draft: { title: 'A' },
  });
  assert.equal(view.id, 'abc123');
  assert.equal(view.moderationStatus, 'draft');
  assert.equal(view.draftVersion, 3);
  assert.equal('_id' in view, false);
  assert.equal('__v' in view, false);
  assert.equal('seedKey' in view, false);
});
