import test from 'node:test';
import assert from 'node:assert/strict';
import { searchLibrary } from '../src/services/librarySearch.ts';
const tracks = [
  {id:'1',title:'Coração de Fogo',artist:'Ana',album:'Noite'},
  {id:'2',title:'Brisa',artist:'João',album:'Verão'},
  {id:'3',title:'Fogo Vivo',artist:'Ana',album:'Dia'}
];
test('busca sem diferenciar acentos ou maiúsculas',()=>assert.deepEqual(searchLibrary(tracks,'CORACAO',[],false).map(t=>t.id),['1']));
test('busca por múltiplos termos em campos diferentes',()=>assert.deepEqual(searchLibrary(tracks,'ana fogo',[],false).map(t=>t.id),['1','3']));
test('filtro de favoritas',()=>assert.deepEqual(searchLibrary(tracks,'', ['2'],true).map(t=>t.id),['2']));
test('sem resultados retorna lista vazia',()=>assert.deepEqual(searchLibrary(tracks,'xyz',[],false),[]));
