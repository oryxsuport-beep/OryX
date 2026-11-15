import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,parseBackup} from '../src/services/backup.ts';
const sample = createBackup({profile:{displayName:'OryX',accent:'#ff3038',motion:true},favorites:['a'],recent:['b'],playCounts:{a:2}});
test('exportar e restaurar configurações',()=>assert.deepEqual(parseBackup(JSON.stringify(sample)).favorites,['a']));
test('rejeitar arquivo inválido',()=>assert.throws(()=>parseBackup('{'),/JSON inválido/));
test('rejeitar versão incompatível',()=>assert.throws(()=>parseBackup(JSON.stringify({...sample,version:2})),/incompatível/));
test('sanitizar contagens e listas',()=>{const b=parseBackup(JSON.stringify({...sample,favorites:['a','a',7],playCounts:{a:-1,b:3}}));assert.deepEqual(b.favorites,['a']);assert.deepEqual(b.playCounts,{b:3});});
test('rejeitar cor malformada',()=>assert.throws(()=>parseBackup(JSON.stringify({...sample,profile:{...sample.profile,accent:'red'}})),/perfil inválidos/));
