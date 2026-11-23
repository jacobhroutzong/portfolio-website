import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStudyStore, mergeStudyProgress, normalizeStudyProgress } from '../src/lib/study-progress.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const empty = () => ({ ratings: {}, completed: {} });
function memory() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function server() {
  const rows = new Map();
  const writes = [];
  let offline = false;
  let loseNextResponse = false;
  return {
    rows, writes,
    set offline(value) { offline = value; },
    set loseNextResponse(value) { loseNextResponse = value; },
    async read(area, user) {
      if (offline) throw new Error('offline');
      return clone(rows.get(`${area}:${user}`) ?? null);
    },
    async write(area, user, expected, payload, reset) {
      if (offline) throw new Error('offline');
      const key = `${area}:${user}`;
      if ((rows.get(key)?.revision ?? 0) !== expected) throw Object.assign(new Error('conflict'), { code: 'CONFLICT' });
      const row = { revision: expected + 1, payload: clone(payload), reset };
      rows.set(key, row);
      writes.push({ area, user, ...clone(row) });
      if (loseNextResponse) { loseNextResponse = false; throw new Error('response lost'); }
      return clone(row);
    },
  };
}
const create = (transport, storage = memory(), extra = {}) => createStudyStore({ area: 'ew', guestKey: 'ew-study.progress.v1', storage, transport, ...extra });
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('guest study stays local; sign-in requires an explicit import and sign-out restores the guest', async () => {
  const backend = server();
  const storage = memory();
  const store = create(backend, storage);
  store.save({ ratings: { q1: 'review' }, completed: { lesson1: true } });
  const guest = storage.getItem('ew-study.progress.v1');
  assert.equal(backend.writes.length, 0);
  await store.setUser('alice');
  assert.deepEqual(store.get(), empty());
  assert.equal(store.snapshot().hasGuest, true);
  assert.equal(backend.writes.length, 0);
  await store.importGuest();
  assert.equal(store.get().ratings.q1, 'review');
  assert.equal(backend.rows.get('ew:alice').revision, 1);
  await store.importGuest();
  assert.equal(backend.rows.get('ew:alice').revision, 1, 'repeat import creates no write or double count');
  store.save({ ratings: { q1: 'got-it' }, completed: {} });
  await store.retry();
  assert.equal(storage.getItem('ew-study.progress.v1'), guest);
  await store.setUser(null);
  assert.equal(store.get().ratings.q1, 'review');
  assert.equal(store.snapshot().status, 'guest');
});

test('two devices preserve a conflicting version until an explicit resolution', async () => {
  const backend = server();
  const a = create(backend);
  const b = create(backend);
  await Promise.all([a.setUser('alice'), b.setUser('alice')]);
  a.save({ ratings: { q1: 'got-it' }, completed: {} });
  await a.retry();
  b.save({ ratings: { q2: 'review' }, completed: {} });
  await b.retry();
  assert.equal(b.snapshot().status, 'conflict');
  assert.equal(b.get().ratings.q2, 'review', 'local work is retained');
  assert.equal(backend.rows.get('ew:alice').payload.ratings.q1, 'got-it');
  await b.resolveConflict('remote');
  assert.deepEqual(b.get(), a.get());
  assert.equal(b.snapshot().status, 'saved');
});

test('a reset remains a revisioned tombstone and a stale device cannot revive it silently', async () => {
  const backend = server();
  const a = create(backend);
  await a.setUser('alice');
  a.save({ ratings: { q1: 'got-it' }, completed: { lesson1: true } });
  await a.retry();
  const stale = create(backend);
  await stale.setUser('alice');
  a.reset();
  await a.retry();
  assert.equal(backend.rows.get('ew:alice').revision, 2);
  assert.equal(backend.rows.get('ew:alice').reset, true);
  stale.mutate(data => { data.ratings.q2 = 'review'; });
  await stale.retry();
  assert.equal(stale.snapshot().status, 'conflict');
  assert.equal(stale.snapshot().conflict.reset, true);
  assert.deepEqual(backend.rows.get('ew:alice').payload, empty());
  await stale.resolveConflict('remote');
  assert.deepEqual(stale.get(), empty());
});

test('an explicit local choice uses a new CAS and can conflict again instead of overwriting a third update', async () => {
  const backend = server();
  const a = create(backend);
  const b = create(backend);
  await Promise.all([a.setUser('alice'), b.setUser('alice')]);
  a.save({ ratings: { q1: 'got-it' }, completed: {} });
  await a.retry();
  b.save({ ratings: { q2: 'review' }, completed: {} });
  await b.retry();
  a.mutate(data => { data.ratings.q3 = 'got-it'; });
  await a.retry();
  await b.resolveConflict('local');
  assert.equal(b.snapshot().status, 'conflict');
  assert.equal(backend.rows.get('ew:alice').payload.ratings.q3, 'got-it');
  await b.resolveConflict('local');
  assert.equal(b.snapshot().status, 'saved');
  assert.equal(backend.rows.get('ew:alice').payload.ratings.q2, 'review');
});

test('offline pending changes survive reload and a lost save response is acknowledged without replaying it', async () => {
  const backend = server();
  const storage = memory();
  const first = create(backend, storage);
  await first.setUser('alice');
  backend.offline = true;
  first.save({ ratings: { q1: 'review' }, completed: {} });
  await first.retry();
  assert.equal(first.snapshot().status, 'offline');
  first.destroy();
  backend.offline = false;
  backend.loseNextResponse = true;
  const second = create(backend, storage);
  await second.setUser('alice');
  assert.equal(second.snapshot().status, 'offline');
  assert.equal(backend.rows.get('ew:alice').revision, 1);
  second.destroy();
  const third = create(backend, storage);
  await third.setUser('alice');
  assert.equal(third.snapshot().status, 'saved');
  assert.equal(third.get().ratings.q1, 'review');
  assert.equal(backend.rows.get('ew:alice').revision, 1);
  assert.equal(backend.writes.length, 1);
});

test('late reads and writes from a signed-out account cannot populate the next account or guest storage', async () => {
  const backend = server();
  const slowRead = deferred();
  const storage = memory();
  const transport = { ...backend, read: async (area, user) => user === 'alice' ? slowRead.promise : backend.read(area, user) };
  const store = create(transport, storage);
  const firstRead = store.setUser('alice');
  await store.setUser('bob');
  slowRead.resolve({ revision: 1, payload: { ratings: { privateAlice: 'review' }, completed: {} }, reset: false });
  await firstRead;
  assert.equal(store.snapshot().userId, 'bob');
  assert.deepEqual(store.get(), empty());

  const slowWrite = deferred();
  const originalWrite = transport.write;
  transport.write = async (...args) => { await slowWrite.promise; return originalWrite(...args); };
  store.save({ ratings: { privateBob: 'review' }, completed: {} });
  await store.setUser(null);
  slowWrite.resolve();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(store.snapshot().userId, null);
  assert.deepEqual(store.get(), empty());
  assert.equal(storage.getItem('ew-study.progress.v1'), null);
  assert.equal(backend.writes.every(write => write.user === 'bob'), true);
});

test('writes are serialized and newer edits made during a save remain pending until saved', async () => {
  const backend = server();
  const firstWrite = deferred();
  let count = 0;
  let inFlight = 0;
  let maximum = 0;
  const transport = { ...backend, async write(...args) {
    count++;
    inFlight++;
    maximum = Math.max(maximum, inFlight);
    if (count === 1) await firstWrite.promise;
    const result = await backend.write(...args);
    inFlight--;
    return result;
  } };
  const store = create(transport);
  await store.setUser('alice');
  store.mutate(data => { data.ratings.q1 = 'review'; });
  store.mutate(data => { data.completed.lesson1 = true; });
  firstWrite.resolve();
  await store.retry();
  assert.equal(maximum, 1);
  assert.equal(backend.rows.get('ew:alice').revision, 2);
  assert.deepEqual(backend.rows.get('ew:alice').payload, store.get());
});

test('a read started before a successful write cannot roll it back on arrival', async () => {
  const backend = server();
  const transport = { read: (...args) => backend.read(...args), write: (...args) => backend.write(...args) };
  const store = create(transport);
  await store.setUser('alice');
  store.mutate(data => { data.ratings.q1 = 'review'; });
  await store.retry();
  const before = clone(backend.rows.get('ew:alice'));
  const oldRead = deferred();
  transport.read = () => oldRead.promise;
  const refreshing = store.retry();
  store.mutate(data => { data.ratings.q2 = 'got-it'; });
  await store.retry();
  oldRead.resolve(before);
  await refreshing;
  assert.equal(store.get().ratings.q2, 'got-it');
  assert.equal(store.snapshot().status, 'saved');
  assert.equal(backend.rows.get('ew:alice').revision, 2);
});

test('guest mutations merge current tabs and preserve failed writes and resets in memory', () => {
  const backend = server();
  const storage = memory();
  const a = create(backend, storage);
  const b = create(backend, storage);
  a.mutate(data => { data.ratings.q1 = 'review'; });
  b.mutate(data => { data.completed.lesson1 = true; });
  assert.equal(JSON.parse(storage.getItem('ew-study.progress.v1')).ratings.q1, 'review');
  const write = storage.setItem;
  storage.setItem = () => { throw new Error('quota'); };
  a.mutate(data => { data.ratings.q2 = 'got-it'; });
  assert.equal(a.snapshot().storageAvailable, false);
  storage.setItem = write;
  a.mutate(data => { data.ratings.q3 = 'review'; });
  assert.equal(a.get().ratings.q2, 'got-it');
  assert.equal(a.get().completed.lesson1, true);
  storage.removeItem = () => { throw new Error('blocked'); };
  a.reset();
  a.mutate(data => { data.ratings.afterReset = 'review'; });
  assert.deepEqual(a.get(), { ratings: { afterReset: 'review' }, completed: {} });
});

test('blocked storage preserves supplied guest data in memory and never writes it to another account', async () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const backend = server();
  const store = create(backend, storage, { initial: { ratings: { q1: 'review' }, completed: {} } });
  assert.equal(store.get().ratings.q1, 'review');
  await store.setUser('alice');
  assert.deepEqual(store.get(), empty());
  assert.equal(backend.writes.length, 0);
  await store.setUser(null);
  assert.equal(store.get().ratings.q1, 'review');
});

test('an offline tab cannot silently overwrite another tab’s pending cache', async () => {
  const backend = server();
  const storage = memory();
  const a = create(backend, storage);
  const b = create(backend, storage);
  await Promise.all([a.setUser('alice'), b.setUser('alice')]);
  backend.offline = true;
  a.save({ ratings: { firstTab: 'review' }, completed: {} });
  await a.retry();
  b.save({ ratings: { secondTab: 'got-it' }, completed: {} });
  await b.retry();
  assert.equal(b.get().ratings.secondTab, 'got-it');
  assert.equal(b.snapshot().storageAvailable, false);
  assert.equal(JSON.parse(storage.getItem('army-study.account.v1:ew:alice')).payload.ratings.firstTab, 'review');
  backend.offline = false;
  await a.retry();
  await b.retry();
  assert.equal(b.snapshot().status, 'conflict');
  assert.equal(backend.rows.get('ew:alice').payload.ratings.firstTab, 'review');
});

test('PhaseUp imports preserve newer records and deduplicate repeated history without summing counters', () => {
  const record = { attempts: 4, correct: 2, misses: 2, streak: 1, due: 100, last: 'known', updated: '2026-11-22T12:00:00Z' };
  const backup = { records: { card1: record }, events: [{ id: 'card1', q: 'A question', cat: 'Core', rating: 'known', date: record.updated }], exams: [{ when: record.updated, correct: 8, total: 10, category: 'Core' }] };
  const first = mergeStudyProgress('phaseup', {}, backup);
  const second = mergeStudyProgress('phaseup', first, backup);
  assert.deepEqual(second, first);
  assert.equal(second.records.card1.attempts, 4);
  assert.equal(second.events.length, 1);
  assert.equal(second.exams.length, 1);
  const newer = clone(backup);
  newer.records.card1.attempts = 5;
  newer.records.card1.updated = '2026-11-23T12:00:00Z';
  assert.equal(mergeStudyProgress('phaseup', first, newer).records.card1.attempts, 5);
});

test('normalization rejects oversized backups and filters unsafe keys and invalid ratings', () => {
  const input = JSON.parse('{"ratings":{"__proto__":"got-it","constructor":"review","valid":"review","invalid":"admin"},"completed":{"lesson":true}}');
  assert.deepEqual(normalizeStudyProgress('ew', input), { ratings: { valid: 'review' }, completed: { lesson: true } });
  assert.throws(() => normalizeStudyProgress('ew', { extra: 'x'.repeat(1_000_001) }), /size/);
  assert.equal({}.polluted, undefined);
});
