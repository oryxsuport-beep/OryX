import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeCapsule, openTimeCapsule } from '../src/services/timeCapsule.ts';
import { calculateAchievements } from '../src/services/achievements.ts';
import { classifyPlayerSwipe } from '../src/services/gesture.ts';
test('time capsule remains locked until unlock date', () => {
  const capsule = createTimeCapsule('Minha playlist', ['a','a','b'], 2000, 1000);
  assert.deepEqual(capsule.trackIds, ['a','b']);
  assert.equal(openTimeCapsule(capsule, 1999), null);
  assert.deepEqual(openTimeCapsule(capsule, 2000), ['a','b']);
});
test('time capsule rejects invalid input', () => {
  assert.throws(() => createTimeCapsule(' ', ['a'], 2000, 1000));
  assert.throws(() => createTimeCapsule('Ok', [], 2000, 1000));
  assert.throws(() => createTimeCapsule('Ok', ['a'], 1000, 1000));
});
test('achievements depend on real local play counts', () => {
  assert.deepEqual(calculateAchievements({ a: 1 }, [], 0), ['first-play']);
  assert.deepEqual(calculateAchievements({ a: 100 }, Array.from({length:10},(_,i)=>String(i)), 5), ['first-play','music-lover','explorer','collector']);
});
test('horizontal gestures do not capture vertical scrolling', () => {
  assert.equal(classifyPlayerSwipe(-90, 10), 'next');
  assert.equal(classifyPlayerSwipe(90, 10), 'previous');
  assert.equal(classifyPlayerSwipe(100, 110), 'none');
  assert.equal(classifyPlayerSwipe(20, 0), 'none');
});
