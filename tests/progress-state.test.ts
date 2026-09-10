import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adjustedCompletionCount,
  nextCompletedStageIds,
  parseCompletedStageIds,
} from '../src/shared/progress-state.ts';

test('completed stage parsing rejects malformed data and removes duplicates', () => {
  assert.deepEqual(parseCompletedStageIds('not-json'), []);
  assert.deepEqual(parseCompletedStageIds('{"stage":true}'), []);
  assert.deepEqual(parseCompletedStageIds('["one",3,"one","two"]'), [
    'one',
    'two',
  ]);
});

test('completed stage parsing keeps only active session identifiers', () => {
  assert.deepEqual(
    parseCompletedStageIds(
      '["removed","active"]',
      new Set(['active', 'other'])
    ),
    ['active']
  );
});

test('progress state changes are idempotent and counts never become negative', () => {
  assert.deepEqual(nextCompletedStageIds(['one'], 'one', true), ['one']);
  assert.deepEqual(nextCompletedStageIds(['one'], 'two', true), ['one', 'two']);
  assert.deepEqual(nextCompletedStageIds(['one', 'two'], 'one', false), [
    'two',
  ]);
  assert.equal(adjustedCompletionCount('0', -1), 0);
  assert.equal(adjustedCompletionCount('4', -1), 3);
  assert.equal(adjustedCompletionCount(undefined, 1), 1);
});
