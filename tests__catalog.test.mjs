import test from 'node:test';
import assert from 'node:assert/strict';
import { detectVersion, baseTitle, uniqueCatalog, durationSeconds } from '../src/services/catalog.ts';

test('recognizes fan edits as distinct versions', () => {
  assert.equal(detectVersion('Canção (Slowed + Reverb)'), 'slowed');
  assert.equal(detectVersion('Canção - Sped-Up'), 'sped-up');
  assert.equal(detectVersion('Canção - Nightcore'), 'nightcore');
  assert.equal(detectVersion('Canção (Remix)'), 'remix');
  assert.equal(baseTitle('Canção - Sped-Up'), baseTitle('Canção'));
});
test('collapses identical recordings but keeps different edits', () => {
  const tracks = [
    { id:'1', title:'Canção', artist:'Artista', duration:'3:20' },
    { id:'2', title:'Canção', artist:'Artista', duration:'3:20' },
    { id:'3', title:'Canção (Slowed + Reverb)', artist:'Artista', duration:'3:45' },
    { id:'4', title:'Canção', artist:'Artista', duration:'3:25' },
  ];
  assert.deepEqual(uniqueCatalog(tracks).map(x => x.id), ['1','3','4']);
});

test('normalizes equivalent durations without merging unknown recordings', () => {
  assert.equal(durationSeconds('03:20'), 200);
  assert.equal(durationSeconds('200'), 200);
  assert.equal(durationSeconds('1:03:20'), 3800);
  assert.equal(durationSeconds('3:99'), undefined);
  const tracks = [
    {id:'a', title:'Música', artist:'Artista', duration:'03:20'},
    {id:'b', title:'Música', artist:'Artista', duration:'200'},
    {id:'c', title:'Música', artist:'Artista'},
    {id:'d', title:'Música', artist:'Artista'},
  ];
  assert.deepEqual(uniqueCatalog(tracks).map(t => t.id), ['a','c','d']);
});


test('rejects invalid and unsafe durations', () => {
  assert.equal(durationSeconds(''), undefined);
  assert.equal(durationSeconds('-30'), undefined);
  assert.equal(durationSeconds('2:60'), undefined);
  assert.equal(durationSeconds('9007199254740993'), undefined);
  assert.equal(durationSeconds(' 03:20 '), 200);
});

test('retains alternate edits even when durations match', () => {
  const tracks = [
    {id:'original', title:'Música', artist:'Artista', duration:'200'},
    {id:'nightcore', title:'Música (Nightcore)', artist:'Artista', duration:'200'},
    {id:'sped', title:'Música - Sped-Up', artist:'Artista', duration:'200'},
    {id:'repeat', title:'Música', artist:'Artista', duration:'03:20'},
  ];
  assert.deepEqual(uniqueCatalog(tracks).map(t => t.id), ['original','nightcore','sped']);
});
