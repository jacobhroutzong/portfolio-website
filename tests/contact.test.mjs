import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, submitContact } from '../src/lib/contact.mjs';
const valid = { name:'Test Visitor',email:'visitor@example.org',message:'This is a synthetic test message.',consent:true };
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
