import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const staticDir=fs.existsSync(path.join(root,'static/app.js'))?path.join(root,'static'):path.join(root,'public/equityscout');
const markets={FL:['Jacksonville'],AL:['Birmingham'],GA:['Warner Robins'],SC:['Columbia'],NC:['Fayetteville'],TN:['Memphis'],MS:['Jackson'],OH:['Cleveland']};
const records=Object.entries(markets).map(([state,cities],i)=>({id:String(i),state,city:cities[0],address:`Synthetic ${i}`,analysis:{score:i}}));
records.push({id:'unreviewed',state:'FL',city:'Unreviewed Town',address:'Synthetic other',analysis:{score:1}},
  {id:'california',state:'CA',city:'Sacramento',address:'Synthetic west',analysis:{score:2}},
  {id:'foreign',state:'ON',city:'Toronto',address:'Synthetic foreign',analysis:{score:3}});
function harness(){
  const content={innerHTML:''},controls=new Map();
  const context=vm.createContext({console,setTimeout,clearTimeout,Intl,URL,Blob,
    document:{addEventListener(){},querySelector(selector){if(selector==='#content')return content;if(!controls.has(selector))controls.set(selector,{focus(){}});return controls.get(selector);},querySelectorAll(){return [];}}});
  vm.runInContext(fs.readFileSync(path.join(staticDir,'regions.js'),'utf8'),context);
  const source=fs.readFileSync(path.join(staticDir,'app.js'),'utf8');
  vm.runInContext(source.slice(0,source.indexOf('(async()=>{try{db=await api(\'bootstrap\')')),context);
  vm.runInContext(`globalThis.subject={regions:scoutRegions,setData(value){db=value;},scope:scoped,visible,cards,render,switchRegion,header:regionHeader,controls:handleControl,
    setFilters(value){term=value.term||'';stateFilter=value.state||'ALL';priority=value.sort||'score';},filters(){return {region,term,state:stateFilter,sort:priority};},setView(value){view=value;}}`,context);
  context.subject.setData({token:'synthetic-test',deals:records,markets,settings:{target_ratio:.75,min_cashflow:250,min_dscr:1.25}});
  return {subject:context.subject,content};
}
test('Southeast default is exactly the requested seven states and shortlisted cities',()=>{
  const {subject:s}=harness();
  assert.equal(s.filters().region,'southeast');
  assert.equal(s.scope().length,7);
  assert.deepEqual(Array.from(s.regions.southeast),['FL','AL','GA','SC','NC','TN','MS']);
  assert.equal(s.regions.scope([{state:' al ',city:' BIRMINGHAM '}],markets).length,1);
  assert.equal(s.regions.scope([{state:'GA',city:'Birmingham'}],markets).length,0);
});
test('Nationwide includes Southeast plus other U.S. states, including states outside the guide',()=>{
  const {subject:s}=harness();s.setView('markets');s.switchRegion('nationwide');
  const ids=Array.from(s.scope(),x=>x.id);
  assert.equal(ids.length,10);assert.ok(ids.includes('california'));assert.ok(!ids.includes('foreign'));
  assert.ok(ids.includes('0'));assert.ok(ids.includes('unreviewed'));
});
test('regional filter state is independent and restored when switching tabs',()=>{
  const {subject:s}=harness();s.setView('markets');s.setFilters({term:'Synthetic',state:'GA',sort:'price'});
  s.switchRegion('nationwide');assert.equal(s.filters().state,'ALL');
  s.setFilters({term:'west',state:'CA',sort:'recent'});
  s.switchRegion('southeast');assert.equal(s.filters().state,'GA');assert.equal(s.filters().term,'Synthetic');
  s.switchRegion('nationwide');assert.equal(s.filters().state,'CA');assert.equal(s.visible()[0].id,'california');
});
test('other Southeast cities require explicit opt-in and switching never deletes records',()=>{
  const {subject:s}=harness();s.setView('markets');
  s.controls({target:{id:'includeOtherCities',checked:true,getAttribute(name){return this[name];}}});assert.equal(s.scope().length,8);
  s.switchRegion('nationwide');s.switchRegion('southeast');assert.equal(s.scope().length,8);
  s.controls({target:{id:'includeOtherCities',checked:false,getAttribute(name){return this[name];}}});assert.equal(s.scope().length,7);
  s.switchRegion('nationwide');assert.equal(s.scope().length,10);
});
test('market guide removes unsupported automatic tiers and scopes available city choices',()=>{
  const {subject:s,content}=harness();s.setView('markets');s.render();
  assert.match(content.innerHTML,/Southeast market shortlist/);assert.match(content.innerHTML,/Warner Robins/);
  assert.doesNotMatch(content.innerHTML,/Cleveland|S\+ TIER|Top city:/);
  assert.match(content.innerHTML,/aria-selected="true"/);assert.match(content.innerHTML,/role="tabpanel"/);
  s.switchRegion('nationwide');assert.match(content.innerHTML,/Cleveland/);
});
