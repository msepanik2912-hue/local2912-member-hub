import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
function helper(fetcher) {
  const context = vm.createContext({URL, AbortController, setTimeout, clearTimeout, fetch:fetcher});
  vm.runInContext(read('public/js/feed-utils.js'), context);
  return context.LOCAL2912_FEEDS;
}
test('live reads omit credentials and send only GET', async () => {
  let options;
  const h = helper(async (url, o) => {options=o; return {ok:true,json:async()=>({items:[]})};});
  assert.equal((await (await h.request('https://example.org/feed')).json()).items.length,0);
  assert.equal(options.method,'GET'); assert.equal(options.credentials,'omit');
  assert.equal(options.body,undefined); assert.equal(options.referrerPolicy,'no-referrer');
});
test('insecure and credential-bearing endpoints rejected', async () => {
  const h=helper(()=>assert.fail('must not request'));
  await assert.rejects(h.request('http://example.org'));
  await assert.rejects(h.request('https://user:password@example.org'));
});
test('request timeout aborts a stalled response', async () => {
  const h=helper((url,o)=>new Promise((resolve,reject)=>o.signal.addEventListener('abort',()=>reject(new Error('aborted')))));
  await assert.rejects(h.request('https://example.org',5),/aborted/);
});
test('HTTP errors and malformed JSON are rejected', async () => {
  await assert.rejects(helper(async()=>({ok:false})).request('https://example.org'));
  await assert.rejects(helper(async()=>({ok:true,json:async()=>{throw new Error('JSON');}})).request('https://example.org'));
});
test('error/malformed item feeds do not become empty live success', () => {
  const h=helper();
  for (const value of [{error:'unconfigured'}, {}, {items:{}}, {items:[null]}]) assert.throws(()=>h.items(value));
  assert.equal(h.items({items:[]}).length,0);
  assert.equal(h.items([{name:'Test fixture'}]).length,1);
});
test('document structure checks distinguish empty supplements from absent core text', () => {
  const h=helper();
  assert.equal(h.validDocument('cbaCorpus',{records:[]}),false);
  assert.equal(h.validDocument('supplementsCorpus',{records:[]}),true);
  assert.equal(h.validDocument('sourceManifest',{sources:[]}),false);
  assert.equal(h.validDocument('personnelCorpus',{error:'missing'}),false);
  for (const [kind,file] of [['cbaCorpus','cba_corpus'],['personnelCorpus','personnel_corpus'],['sourceManifest','source_manifest'],['sourceArchive','source_archive']]) {
    assert.equal(h.validDocument(kind,JSON.parse(read(`public/data/${file}.json`))),true);
  }
});
function worker() {
  const handlers={}, deleted=[];
  const scope='https://example.github.io/local2912-member-hub/';
  const prefix=`local2912:${scope}:`;
  const context=vm.createContext({URL,Response,self:{registration:{scope},clients:{claim:async()=>{}},addEventListener:(name,fn)=>handlers[name]=fn},
    caches:{keys:async()=>[prefix+'0.8.0',prefix+'0.9.0','another-site-cache'],delete:async key=>deleted.push(key)}});
  vm.runInContext(read('public/sw.js'),context);
  return {handlers,deleted,prefix};
}
test('cache cleanup only touches this repository old versions', async () => {
  const w=worker();let pending;
  w.handlers.activate({waitUntil:p=>pending=p});await pending;
  assert.deepEqual(w.deleted,[w.prefix+'0.8.0']);
});
test('Google and other repository requests bypass offline cache', () => {
  const w=worker();
  for (const url of ['https://script.google.com/macros/s/test/exec','https://example.github.io/other/data.json']) {
    w.handlers.fetch({request:{method:'GET',url},respondWith:()=>assert.fail('must bypass')});
  }
});
test('Board output normalizes headers and excludes unapproved columns', () => {
  const c=vm.createContext({}); vm.runInContext(read('google_admin_backend/Code.gs'),c);
  c.rowsAsObjects_=()=>[{Publish:true,Active:true,Name:'Fixture',Office:'Chair',PrivateCase:'never publish'}];
  const rows=c.getPublishedRows_('Board');
  assert.equal(rows[0].name,'Fixture');assert.equal(rows[0].office,'Chair');
  assert.equal(rows[0].PrivateCase,undefined);assert.equal(rows[0].Name,undefined);
});
test('admin rejects blank allowlists and unknown callers, even with allowed effective owner', () => {
  let allow='',caller='';
  const c=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:()=>allow})},Session:{getActiveUser:()=>({getEmail:()=>caller}),getEffectiveUser:()=>({getEmail:()=>'officer@example.org'})}});
  vm.runInContext(read('google_document_admin/Code.gs'),c);
  assert.throws(()=>c.assertAdmin_());
  allow='officer@example.org';assert.throws(()=>c.assertAdmin_());
  caller='stranger@example.org';assert.throws(()=>c.assertAdmin_());
  caller='officer@example.org';assert.doesNotThrow(()=>c.assertAdmin_());
});
test('all offline core resources exist beneath public', () => {
  for(const match of read('public/sw.js').matchAll(/"\.\/([^"\n]+)"/g)) assert.ok(fs.existsSync(path.join(root,'public',match[1])),match[1]);
  const manifest=JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(manifest.id,'./'); assert.equal(manifest.scope,'./');
});
test('public package has no admin scripts and configuration is blank', () => {
  const c=vm.createContext({window:{}});vm.runInContext(read('public/js/config.js'),c);
  assert.ok(Object.values(c.window.LOCAL2912_CONFIG.integrations).every(x=>x===''));
  assert.equal(fs.existsSync(path.join(root,'public/google_document_admin')),false);
  assert.match(read('.github/workflows/pages.yml'),/path: public/);
});
