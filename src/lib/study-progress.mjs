const AREAS = new Set(['phaseup', 'acronyms', 'ew', 'soldier']);
const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_BYTES = 1_000_000;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_.:-]{0,159}$/i.test(value) && !BAD_KEYS.has(value);
const copy = value => JSON.parse(JSON.stringify(value));
const number = value => Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), 10_000_000) : 0;
const short = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const date = value => typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';
const blank = area => area === 'phaseup' ? { records: {}, events: [], exams: [] } : { ratings: {}, completed: {} };
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nonempty = (area, data) => area === 'phaseup'
  ? Object.keys(data.records).length > 0 || data.events.length > 0 || data.exams.length > 0
  : Object.keys(data.ratings).length > 0 || Object.keys(data.completed).length > 0;

function bounded(value) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_BYTES) throw new Error('Study progress exceeds the supported backup size.');
  return value;
}

function unique(items, key, limit, timestamp) {
  const indexed = new Map();
  for (const item of items) indexed.set(key(item), item);
  return [...indexed.values()].sort((a, b) => a[timestamp].localeCompare(b[timestamp])).slice(-limit);
}

/** Keep the existing progress formats, while rejecting unsafe keys and invalid values. */
export function normalizeStudyProgress(area, input) {
  if (!AREAS.has(area)) throw new Error('Unknown study area.');
  if (!object(input)) return blank(area);
  bounded(input);
  const out = blank(area);
  if (area !== 'phaseup') {
    for (const [id, rating] of Object.entries(object(input.ratings) ? input.ratings : {}).slice(0, 10_000).sort()) {
      if (safeId(id) && ['review', 'got-it'].includes(rating)) out.ratings[id] = rating;
    }
    for (const [id, completed] of Object.entries(object(input.completed) ? input.completed : {}).slice(0, 10_000).sort()) {
      if (safeId(id) && completed === true) out.completed[id] = true;
    }
  } else {
    for (const [id, record] of Object.entries(object(input.records) ? input.records : {}).slice(0, 10_000).sort()) {
      if (!safeId(id) || !object(record)) continue;
      out.records[id] = {
        attempts: number(record.attempts), correct: number(record.correct), misses: number(record.misses),
        streak: number(record.streak), due: Number.isFinite(record.due) && record.due >= 0 ? Math.min(record.due, 8_640_000_000_000_000) : 0,
        last: ['known', 'hard', 'missed'].includes(record.last) ? record.last : '', updated: date(record.updated),
      };
    }
    const events = (Array.isArray(input.events) ? input.events : []).filter(event => object(event) && safeId(event.id) && date(event.date) && ['known', 'hard', 'missed'].includes(event.rating)).map(event => ({
      ...(safeId(event.uid) ? { uid: event.uid } : {}), id: event.id, q: short(event.q, 2000), cat: short(event.cat, 200), rating: event.rating, date: date(event.date),
    }));
    const exams = (Array.isArray(input.exams) ? input.exams : []).filter(exam => object(exam) && date(exam.when)).map(exam => ({
      ...(safeId(exam.uid) ? { uid: exam.uid } : {}), when: date(exam.when), correct: Math.min(number(exam.correct), number(exam.total)), total: number(exam.total), category: short(exam.category, 200),
    }));
    out.events = unique(events, event => event.uid || JSON.stringify([event.id, event.date, event.rating]), 400, 'date');
    out.exams = unique(exams, exam => exam.uid || JSON.stringify([exam.when, exam.correct, exam.total, exam.category]), 100, 'when');
  }
  return bounded(out);
}

/** Explicit import is idempotent; it never sums counters from two copies of a backup. */
export function mergeStudyProgress(area, account, guest) {
  const a = normalizeStudyProgress(area, account);
  const b = normalizeStudyProgress(area, guest);
  if (area !== 'phaseup') return normalizeStudyProgress(area, {
    ratings: { ...b.ratings, ...a.ratings }, completed: { ...b.completed, ...a.completed },
  });
  for (const [id, record] of Object.entries(b.records)) {
    if (!a.records[id] || (Date.parse(record.updated) || 0) > (Date.parse(a.records[id].updated) || 0)) a.records[id] = record;
  }
  a.events.push(...b.events);
  a.exams.push(...b.exams);
  return normalizeStudyProgress(area, a);
}

function remoteRow(area, row) {
  if (row === null) return { revision: 0, payload: blank(area), reset: false };
  if (!object(row) || !Number.isSafeInteger(row.revision) || row.revision < 1 || typeof row.reset !== 'boolean') throw new Error('The saved progress response was invalid.');
  return { revision: row.revision, payload: normalizeStudyProgress(area, row.payload), reset: row.reset };
}

/**
 * A small snapshot/CAS store. Conflicting devices require an explicit choice;
 * a stale device cannot silently overwrite a newer save or a reset tombstone.
 * transport must enforce the expected authenticated user for every request.
 */
export function createStudyStore({ area, guestKey, storage, transport, initial }) {
  if (!AREAS.has(area) || typeof guestKey !== 'string') throw new Error('Invalid study store configuration.');
  let data = normalizeStudyProgress(area, initial);
  let guestMemory = copy(data);
  let userId = null;
  let revision = 0;
  let resetFlag = false;
  let dirty = false;
  let attempt = null;
  let conflict = null;
  let status = 'guest';
  let error = null;
  let storageError = null;
  let epoch = 0;
  let sequence = 0;
  let ready = true;
  let destroyed = false;
  let running = null;
  let guestReplacementPending = false;
  let guestPending = [];
  let lastAccountCache = null;
  const listeners = new Set();
  const key = () => `army-study.account.v1:${area}:${userId}`;
  const active = (generation, owner) => !destroyed && generation === epoch && owner === userId;
  const failStorage = () => { storageError = 'This browser could not save a local copy. Keep this page open until account saving succeeds, or export your progress.'; };

  function readGuest(first = false) {
    try {
      const raw = storage?.getItem(guestKey);
      if (raw === null || raw === undefined) guestMemory = first && initial ? normalizeStudyProgress(area, initial) : blank(area);
      else guestMemory = normalizeStudyProgress(area, JSON.parse(raw));
    } catch { failStorage(); }
    return copy(guestMemory);
  }
  data = readGuest(true);

  function snapshot() {
    return { data: copy(data), userId, status, hasGuest: nonempty(area, guestMemory), conflict: conflict ? copy(conflict) : null, error: [error, storageError].filter(Boolean).join(' ') || null, storageAvailable: !storageError };
  }
  function emit() {
    if (destroyed) return;
    for (const listener of listeners) listener(snapshot());
  }
  function persistAccount() {
    if (!userId) return;
    try {
      if (!storage) throw new Error('Storage unavailable');
      const currentRaw = storage.getItem(key());
      if (currentRaw && currentRaw !== lastAccountCache) {
        let current;
        try { current = JSON.parse(currentRaw); } catch { /* Replace malformed cache after a learner action. */ }
        if (current?.dirty && (!equal(current.payload, data) || current.reset !== resetFlag)) {
          // Preserve the other tab's unsaved copy. This tab remains usable in
          // memory and may still save to the account, but must warn before close.
          storageError = 'Another tab has unsaved progress on this device, so this tab’s copy could not be cached. If account saving is unavailable, keep this page open or export before closing.';
          return;
        }
      }
      const nextCache = JSON.stringify({ version: 1, revision, payload: data, reset: resetFlag, dirty, attempt });
      storage.setItem(key(), nextCache);
      lastAccountCache = nextCache;
      storageError = null;
    } catch { failStorage(); }
  }
  function cache() {
    try {
      const raw = storage?.getItem(key());
      if (!raw) return;
      lastAccountCache = raw;
      const value = JSON.parse(raw);
      if (!object(value) || value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0) throw new Error('Invalid cache');
      data = normalizeStudyProgress(area, value.payload);
      revision = value.revision;
      resetFlag = value.reset === true;
      dirty = value.dirty === true;
      if (object(value.attempt) && Number.isSafeInteger(value.attempt.expected) && value.attempt.expected >= 0) {
        attempt = { expected: value.attempt.expected, payload: normalizeStudyProgress(area, value.attempt.payload), reset: value.attempt.reset === true };
      }
    } catch { failStorage(); }
  }
  function acknowledge(row) {
    revision = row.revision;
    dirty = !equal(data, row.payload) || resetFlag !== row.reset;
    attempt = null;
    conflict = null;
  }
  function reconcile(row) {
    if (attempt && row.revision === attempt.expected + 1 && equal(row.payload, attempt.payload) && row.reset === attempt.reset) {
      acknowledge(row);
    } else if (dirty) {
      if (row.revision !== revision) {
        conflict = row;
        status = 'conflict';
        error = 'Progress changed on another device. Choose which version to keep.';
        persistAccount();
        emit();
        return false;
      }
      dirty = !equal(data, row.payload) || resetFlag !== row.reset;
    } else {
      data = row.payload;
      revision = row.revision;
      resetFlag = row.reset;
      attempt = null;
    }
    conflict = null;
    error = null;
    status = dirty ? 'saving' : 'saved';
    persistAccount();
    emit();
    return true;
  }

  function sync() {
    if (destroyed || !userId || !ready || conflict || !dirty) return Promise.resolve(snapshot());
    if (running) return running;
    const generation = epoch;
    const owner = userId;
    const task = (async () => {
      while (active(generation, owner) && dirty && !conflict) {
        const sentSequence = sequence;
        const sent = { expected: revision, payload: copy(data), reset: resetFlag };
        attempt = sent;
        status = 'saving';
        error = null;
        persistAccount();
        emit();
        try {
          const row = remoteRow(area, await transport.write(area, owner, sent.expected, sent.payload, sent.reset));
          if (!active(generation, owner)) return;
          if (row.revision !== sent.expected + 1 || !equal(row.payload, sent.payload) || row.reset !== sent.reset) throw new Error('The save could not be verified.');
          acknowledge(row);
          if (sequence === sentSequence) data = row.payload;
          status = dirty ? 'saving' : 'saved';
          error = null;
          persistAccount();
          emit();
        } catch (failure) {
          if (!active(generation, owner)) return;
          if (failure?.code === 'CONFLICT') {
            try {
              const row = remoteRow(area, await transport.read(area, owner));
              if (!active(generation, owner)) return;
              if (reconcile(row) && dirty) continue;
              return;
            } catch { /* Preserve the pending copy if conflict retrieval is offline. */ }
          }
          if (!active(generation, owner)) return;
          status = 'offline';
          error = 'Account saving is unavailable. Your changes are waiting on this device; retry when connected.';
          persistAccount();
          emit();
          return;
        }
      }
    })();
    running = task;
    task.finally(() => { if (running === task) running = null; });
    return task;
  }

  async function refresh() {
    if (!userId || destroyed) return snapshot();
    if (running) { await running; return snapshot(); }
    const generation = epoch;
    const owner = userId;
    try {
      const row = remoteRow(area, await transport.read(area, owner));
      if (!active(generation, owner)) return snapshot();
      // A read started before a successful write must not roll that write back.
      if (row.revision < revision) return snapshot();
      ready = true;
      if (reconcile(row)) await sync();
    } catch {
      if (!active(generation, owner)) return snapshot();
      ready = true;
      status = 'offline';
      error = 'Account progress is unavailable. This device’s saved copy remains available; retry when connected.';
      emit();
    }
    return snapshot();
  }

  function save(input) {
    if (destroyed) return;
    if (userId && !ready) throw new Error('Wait for account progress to finish loading.');
    const normalized = normalizeStudyProgress(area, input);
    if (userId) {
      if (equal(normalized, data) && !resetFlag) return;
      data = normalized;
      resetFlag = false;
      dirty = true;
      sequence++;
      persistAccount();
      emit();
      void sync();
      return;
    }
    data = normalized;
    guestMemory = copy(data);
    guestPending = [];
    guestReplacementPending = true;
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(guestKey, JSON.stringify(data));
      guestReplacementPending = false;
      storageError = null;
    } catch { failStorage(); }
    emit();
  }

  return {
    get: () => copy(data), snapshot,
    subscribe(listener) { listeners.add(listener); listener(snapshot()); return () => listeners.delete(listener); },
    save,
    mutate(change) {
      if (destroyed) return;
      if (userId) { const next = copy(data); change(next); save(next); return; }
      change(data);
      data = normalizeStudyProgress(area, data);
      guestMemory = copy(data);
      guestPending.push(change);
      try {
        if (!storage) throw new Error('Storage unavailable');
        let latest = copy(data);
        if (!guestReplacementPending) {
          const raw = storage.getItem(guestKey);
          try { latest = raw ? normalizeStudyProgress(area, JSON.parse(raw)) : blank(area); }
          catch { latest = blank(area); }
          for (const apply of guestPending) apply(latest);
        }
        data = normalizeStudyProgress(area, latest);
        storage.setItem(guestKey, JSON.stringify(data));
        guestMemory = copy(data);
        guestPending = [];
        guestReplacementPending = false;
        storageError = null;
      } catch { failStorage(); }
      emit();
    },
    reset() {
      if (destroyed) return;
      if (userId && !ready) throw new Error('Wait for account progress to finish loading.');
      data = blank(area);
      sequence++;
      if (userId) {
        resetFlag = true;
        dirty = true;
        persistAccount();
        emit();
        void sync();
      } else {
        guestMemory = copy(data);
        guestPending = [];
        guestReplacementPending = true;
        try {
          if (!storage) throw new Error('Storage unavailable');
          storage.removeItem(guestKey);
          guestReplacementPending = false;
          storageError = null;
        } catch { failStorage(); }
        emit();
      }
    },
    async setUser(nextUser) {
      if (nextUser !== null && (typeof nextUser !== 'string' || !/^[a-z0-9_-]{1,128}$/i.test(nextUser))) throw new Error('Invalid account identity.');
      if (destroyed || nextUser === userId) return snapshot();
      epoch++;
      sequence++;
      running = null;
      if (userId === null) guestMemory = copy(data);
      userId = nextUser;
      revision = 0;
      resetFlag = false;
      dirty = false;
      attempt = null;
      conflict = null;
      error = null;
      storageError = null;
      lastAccountCache = null;
      if (userId === null) {
        data = guestReplacementPending ? copy(guestMemory) : readGuest();
        status = 'guest';
        ready = true;
        emit();
        return snapshot();
      }
      data = blank(area);
      cache();
      ready = false;
      status = 'loading';
      emit();
      return refresh();
    },
    retry: refresh,
    async importGuest() {
      if (!userId || !ready || destroyed) return snapshot();
      if (conflict) throw new Error('Resolve the account progress conflict before importing browser progress.');
      const guest = guestReplacementPending ? copy(guestMemory) : readGuest();
      const imported = mergeStudyProgress(area, data, guest);
      if (!equal(imported, data)) save(imported);
      if (running) await running;
      return snapshot();
    },
    async resolveConflict(choice) {
      if (!['remote', 'local'].includes(choice)) throw new Error('Choose the account or device version.');
      if (!userId || !conflict || destroyed) return snapshot();
      if (choice === 'local') {
        revision = conflict.revision;
        conflict = null;
        attempt = null;
        dirty = true;
        error = null;
        persistAccount();
        await sync();
        return snapshot();
      }
      const generation = epoch;
      const owner = userId;
      const selectedSequence = sequence;
      try {
        const row = remoteRow(area, await transport.read(area, owner));
        if (!active(generation, owner) || sequence !== selectedSequence) return snapshot();
        if (row.revision < revision) return snapshot();
        data = row.payload;
        revision = row.revision;
        resetFlag = row.reset;
        dirty = false;
        attempt = null;
        conflict = null;
        status = 'saved';
        error = null;
        persistAccount();
        emit();
      } catch {
        if (active(generation, owner)) { error = 'The account version could not be loaded. Both versions are still available; retry when connected.'; emit(); }
      }
      return snapshot();
    },
    destroy() { destroyed = true; epoch++; listeners.clear(); },
  };
}
