import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { challengeStats, matchesChallenge, repositoryFileUrl } from '../src/lib/challenges.mjs';
import { validateEntry, validateIndex, canonicalIndex } from '../scripts/metadata.mjs';
const entry = { id:'custom-test',title:'Test exercise',platform:'Custom exercises',sourceUrl:'',category:'Algorithms & Data Structures',difficulty:'Easy',language:'JavaScript',topic:'Arrays',tags:['iteration'],solutionPath:'algorithms/custom/solution.mjs',dateSolved:'2020-01-01',complexity:{time:'O(n)',space:'O(1)'},example:false };
test('all filters compose and search is case insensitive', () => {
  assert.equal(matchesChallenge(entry,{platform:'Custom exercises',category:entry.category,difficulty:'Easy',language:'JavaScript',topic:'Arrays',tag:'iteration',search:' TEST '}),true);
  for (const key of ['platform','category','difficulty','language','topic','tag','search']) assert.equal(matchesChallenge(entry,{[key]:'does-not-match'}),false);
});
test('statistics are derived from entries, including empty snapshots', () => {
  assert.deepEqual(challengeStats([]),{total:0,categories:{},difficulty:{},languages:[],platforms:[]});
  const stats=challengeStats([entry,{...entry,id:'second',language:'Python',difficulty:'Hard'}]);
  assert.equal(stats.total,2); assert.equal(stats.categories[entry.category],2); assert.deepEqual(stats.languages,['JavaScript','Python']); assert.deepEqual(stats.difficulty,{Easy:1,Hard:1});
});
test('metadata rejects invalid dates, unsafe paths, duplicate IDs and fabricated examples in index', () => {
  validateEntry(entry);
  for (const patch of [{dateSolved:'2020-02-30'},{dateSolved:'2999-01-01'},{solutionPath:'../secret'},{sourceUrl:'javascript:alert(1)'},{tags:['a','a']},{benchmark:{runtimeMs:-1}}]) assert.throws(() => validateEntry({...entry,...patch}));
  assert.throws(() => validateIndex({version:1,repositoryUrl:'https://github.com/example/challenges',solutions:[entry,entry]}),/Duplicate/);
  assert.throws(() => validateIndex({version:1,repositoryUrl:'https://github.com/example/challenges',solutions:[{...entry,example:true}]}),/Example/);
});
test('index generation is deterministic and excludes examples', () => {
  const other={...entry,id:'another',example:true};
  assert.equal(canonicalIndex('https://github.com/example/challenges',[other,entry]),canonicalIndex('https://github.com/example/challenges',[entry,other]));
  assert.equal(JSON.parse(canonicalIndex('',[other])).solutions.length,0);
});
test('committed snapshot is valid and source links encode repository paths', async () => {
  validateIndex(JSON.parse(await readFile(new URL('../src/data/challenges.json',import.meta.url),'utf8')));
  assert.equal(repositoryFileUrl('https://github.com/user/repo','sql/my file.sql'),'https://github.com/user/repo/blob/main/sql/my%20file.sql');
});
