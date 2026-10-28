import {test} from 'node:test';
import assert from 'node:assert/strict';
import {combineRepositories} from '../src/lib/repositories.mjs';
const repo=(name,platform,updated,kind=platform==='GitHub'?'Repository':'Space')=>({name,platform,updated,kind,url:`https://${platform==='GitHub'?'github.com/jacobhroutzong':'huggingface.co/spaces/jacobroutzong'}/${name}`,description:'',language:'',archived:false});
test('matching owned repo names combine links and retain GitHub push ordering',()=>{
 const source=[repo('shared','GitHub','2026-10-01'),repo('SHARED','Hugging Face','2026-10-28'),repo('recent','GitHub','2026-10-20')];
 const combined=combineRepositories(source);
 assert.equal(combined.length,2);assert.equal(combined[0].name,'recent');
 assert.deepEqual(combined[1].links.map(link=>link.platform),['GitHub','Hugging Face']);
 assert.equal(source.length,3);assert.equal(source[0].links,undefined);
});
test('Hub-only projects remain visible and sortable; different repo names stay separate',()=>{
 const combined=combineRepositories([repo('github','GitHub','2026-10-20'),repo('hub','Hugging Face','2026-10-25'),repo('dataset','Hugging Face',null,'Dataset')]);
 assert.deepEqual(combined.map(item=>item.name),['hub','github','dataset']);
 assert.equal(combined[0].links[0].kind,'Space');assert.equal(combined[2].links[0].kind,'Dataset');
});
test('fork labels survive merging and empty collections are valid',()=>{
 const combined=combineRepositories([repo('fork','GitHub','2026-10-20','Fork'),repo('fork','Hugging Face','2026-10-25')]);
 assert.equal(combined[0].kind,'Fork');assert.equal(combined[0].links.length,2);assert.deepEqual(combineRepositories([]),[]);
});
