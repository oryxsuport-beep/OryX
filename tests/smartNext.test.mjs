import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const source = new URL('../src/services/smartNext.ts', import.meta.url);
const catalogUrl = pathToFileURL(new URL('../src/services/catalog.ts', import.meta.url).pathname).href;
const code = (await readFile(source, 'utf8')).replace('from "./catalog"', `from "${catalogUrl}"`);
const { recommendNext } = await import(`data:text/javascript,${encodeURIComponent(code.replace('import type { Track } from "../types";', '').replace('export type SmartNextMode = "familiar" | "balanced" | "explore";', '').replace(/: Track\[\]/g, '').replace(/: Track \| undefined/g, '').replace(/: Track/g, '').replace(/: string \| undefined/g, '').replace(/: string\[\]/g, '').replace(/: SmartNextMode/g, '').replace(/: string/g, ''))}`);
const track = (id, title, artist='Artista') => ({id,title,artist,src:`local:${id}`,kind:'local'});
test('Smart Next skips recently played songs when a fresh option exists', () => {
 const songs=[track('a','Primeira'),track('b','Segunda'),track('c','Terceira')];
 assert.equal(recommendNext(songs,'a',['b'],['b'],'familiar')?.id,'c');
});
test('Smart Next avoids replaying a recent alternate edit', () => {
 const songs=[track('a','Primeira'),track('b','Segunda'),track('b2','Segunda (Sped-Up)'),track('c','Terceira')];
 assert.equal(recommendNext(songs,'a',['b2'],['b'],'familiar')?.id,'c');
});
test('Smart Next still chooses a song when all candidates are recent', () => {
 const songs=[track('a','Primeira'),track('b','Segunda')];
 assert.equal(recommendNext(songs,'a',[],['b'],'balanced')?.id,'b');
});
