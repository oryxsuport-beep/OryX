import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSeekTime } from '../src/services/seek.ts';
test('seek forward/backward stays within media', () => {
  assert.equal(clampSeekTime(220, 200, [[0, 200]]), 200);
  assert.equal(clampSeekTime(-10, 200, [[0, 200]]), 0);
  assert.equal(clampSeekTime(63, 200, [[0, 200]]), 63);
});
test('seek respects unavailable gaps and live streams', () => {
  assert.equal(clampSeekTime(35, 100, [[0, 20], [50, 100]]), 20);
  assert.equal(clampSeekTime(80, Infinity, [[70, 100]]), 80);
  assert.equal(clampSeekTime(10, 100, []), null);
  assert.equal(clampSeekTime(NaN, 100, [[0, 100]]), null);
});
