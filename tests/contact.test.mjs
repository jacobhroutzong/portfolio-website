import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStudyCorrectionDraft, validateContact, submitContact } from '../src/lib/contact.mjs';
const valid = { name:'Test Visitor',email:'visitor@example.org',message:'This is a synthetic test message.',consent:true };
test('study correction drafts keep the source context and preserve existing messages',()=>{
 assert.equal(getStudyCorrectionDraft(''),null);
 assert.equal(getStudyCorrectionDraft('?topic=other&source=/study/ew/'),null);
 assert.equal(getStudyCorrectionDraft('?topic=army-study','My existing draft'),'My existing draft');
 const draft=getStudyCorrectionDraft('?topic=army-study&source=%2Fstudy%2F17e%2F');
 for (const label of ['Page: /study/17e/','Suggested correction:','Unit / school (if relevant):','Effective date:','Supporting reference:']) assert.ok(draft.includes(label));
 for (const source of ['https://example.org/','//example.org/study/','/study/../connect/','/study/\nInjected text','/study/'+ 'a'.repeat(201)]) {
  const unsafe=getStudyCorrectionDraft('?topic=army-study&source='+encodeURIComponent(source));
  assert.ok(unsafe.includes('Page: /study/\nCategory'));
 }
});
test('contact validation rejects missing consent, bots, invalid email and oversized input',()=>{
 for (const patch of [{consent:false},{website:'bot'},{email:'bad'},{message:'short'},{name:'x'.repeat(101)}]) assert.throws(()=>validateContact({...valid,...patch}));
 assert.equal(validateContact(valid).email,'visitor@example.org');
});
test('contact only reports acceptance when the provider does, and preserves activation state',async()=>{
 let calls=0;
 const mock=async(url,opts)=>{calls++;assert.equal(url,'https://formsubmit.co/ajax/owner%40example.org');const body=JSON.parse(opts.body);assert.equal(body.email,valid.email);assert.equal(body._captcha,undefined);return new Response(JSON.stringify({success:'true'}));};
 assert.equal((await submitContact(valid,'owner@example.org',mock)).status,'accepted');assert.equal(calls,1);
 assert.equal((await submitContact(valid,'owner@example.org',async()=>new Response(JSON.stringify({success:'false',message:'This form needs Activation. We have sent an activation email.'})))).status,'pending');
 await assert.rejects(()=>submitContact(valid,'owner@example.org',async()=>new Response('{}',{status:500})));
 await assert.rejects(()=>submitContact({...valid,consent:false},'owner@example.org',mock));assert.equal(calls,1);
});
