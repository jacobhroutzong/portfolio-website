/* global __STUDY_ACCOUNT_CONFIG__ */
import { createClient } from '@supabase/supabase-js';
import { createStudyStore } from '../lib/study-progress.mjs';

const AUTH_STORAGE_KEY = 'army-study.auth.v1';
const RETURN_STORAGE_KEY = 'army-study.auth.return.v1';
const CALLBACK_PATH = '/study/account/';
const STAGING_SERVICE = 'https://grpwacfkhwwifnjantdn.supabase.co';
const STUDY_PATHS = new Set(['/study/', '/study/17e/', '/study/17e/acronyms/', '/study/ew/', '/study/soldier/']);
const PRODUCTION_HOSTS = new Set(['jacobroutzong.dev', 'www.jacobroutzong.dev', 'portfolio-site-bs9.pages.dev']);
let client;

export function resolveStudyAccountConfig(raw, origin) {
  if (!raw || raw.enabled !== true || !Array.isArray(raw.allowedOrigins) || !raw.allowedOrigins.includes(origin)) return null;
  try {
    const site = new URL(origin);
    const service = new URL(raw.url);
    if (PRODUCTION_HOSTS.has(site.hostname) || service.protocol !== 'https:' || service.pathname !== '/' || service.search || service.hash || service.username || service.password) return null;
    if (service.origin !== STAGING_SERVICE || typeof raw.publishableKey !== 'string' || !raw.publishableKey.startsWith('sb_publishable_')) return null;
    return {
      url: service.origin,
      publishableKey: raw.publishableKey,
      providers: { google: raw.providers?.google === true, apple: raw.providers?.apple === true },
    };
  } catch {
    return null;
  }
}

export function safeStudyReturnPath(value) {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) return '/study/';
  try {
    const url = new URL(value, 'https://study.invalid');
    if (url.origin !== 'https://study.invalid' || !STUDY_PATHS.has(url.pathname)) return '/study/';
    for (const name of [...url.searchParams.keys()]) {
      if (!['course', 'lesson'].includes(name)) url.searchParams.delete(name);
    }
    if (!/^#[a-z0-9_-]*$/i.test(url.hash)) url.hash = '';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/study/';
  }
}

function configuration() {
  return resolveStudyAccountConfig(typeof __STUDY_ACCOUNT_CONFIG__ === 'undefined' ? null : __STUDY_ACCOUNT_CONFIG__, location.origin);
}

export function createBoundedAccountFetch(fetchRequest = fetch, timeoutMs = 12000) {
  return async (input, options = {}) => {
    const controller = new AbortController();
    const parentSignal = options.signal ?? (input instanceof Request ? input.signal : null);
    const abort = () => controller.abort(parentSignal?.reason);
    if (parentSignal?.aborted) abort();
    else parentSignal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => controller.abort(new DOMException('Account request timed out.', 'TimeoutError')), timeoutMs);
    try {
      const response = await fetchRequest(input, { ...options, signal: controller.signal });
      // Keep the deadline through the small Auth/progress JSON response body.
      // The SDK reads the original response after this wrapper returns it.
      await response.clone().arrayBuffer();
      return response;
    } finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener('abort', abort);
    }
  };
}

async function accountDeadline(task) {
  let timeout;
  try {
    return await Promise.race([
      task,
      new Promise((_resolve, reject) => { timeout = setTimeout(() => reject(new Error('Account initialization timed out.')), 12000); }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

function accountClient(config) {
  client ??= createClient(config.url, config.publishableKey, {
    global: { fetch: createBoundedAccountFetch() },
    auth: {
      flowType: 'pkce',
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

function failure(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function createProgressTransport(supabase, currentUser, activeRequests = new Set()) {
  async function request(userId, operation) {
    if (!userId || currentUser() !== userId) throw failure('CANCELLED', 'The study account changed.');
    const controller = new AbortController();
    activeRequests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const result = await operation(controller.signal);
      if (currentUser() !== userId || controller.signal.aborted) throw failure('CANCELLED', 'The study account changed.');
      return result;
    } finally {
      clearTimeout(timeout);
      activeRequests.delete(controller);
    }
  }
  return {
    read(area, userId) {
      return request(userId, async signal => {
        const { data, error } = await supabase.from('army_study_progress')
          .select('revision,payload,reset').eq('user_id', userId).eq('area', area).abortSignal(signal).maybeSingle();
        if (error) throw failure(error.code || 'READ_FAILED', 'Account progress could not be loaded.');
        return data;
      });
    },
    write(area, userId, expectedRevision, payload, reset) {
      return request(userId, async signal => {
        let query;
        if (expectedRevision === 0) {
          query = supabase.from('army_study_progress').insert({ user_id: userId, area, revision: 1, payload, reset });
        } else {
          query = supabase.from('army_study_progress').update({ revision: expectedRevision + 1, payload, reset })
            .eq('user_id', userId).eq('area', area).eq('revision', expectedRevision);
        }
        const { data, error } = await query.select('revision,payload,reset').abortSignal(signal).maybeSingle();
        if (['23505', '40001'].includes(error?.code) || (!error && !data)) throw failure('CONFLICT', 'Saved progress changed on another device.');
        if (error) throw failure(error.code || 'WRITE_FAILED', 'Account progress could not be saved.');
        return data;
      });
    },
  };
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function button(text, action) {
  const result = node('button', text, 'study-account-button');
  result.type = 'button';
  result.addEventListener('click', action);
  return result;
}

function statusText(state) {
  if (state.status === 'loading') return 'Loading your account progress…';
  if (state.status === 'saving') return 'Saving your progress…';
  if (state.status === 'saved') return 'Saved to your account.';
  if (state.status === 'offline') return 'Account progress is not synced. Keep this page open or retry when your connection returns.';
  if (state.status === 'conflict') return 'Progress changed on another device. Choose which progress to keep.';
  if (state.status === 'error') return 'Your progress needs attention. Try again before leaving this page.';
  if (state.error) return 'This browser could not save your progress. You can keep studying while this page is open.';
  return 'Guest progress is saved in this browser.';
}

function mountPanel(container, config, actions) {
  container.classList.add('study-account');
  container.setAttribute('aria-labelledby', 'study-account-title');
  const heading = node('h2', 'Save your study progress');
  heading.id = 'study-account-title';
  const description = node('p', 'Study as a guest, or sign in to save your progress across devices.', 'study-account-description');
  const identity = node('p', '', 'study-account-identity');
  const status = node('p', '', 'study-account-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const error = node('p', '', 'study-account-error');
  error.setAttribute('role', 'alert');
  error.hidden = true;
  const storageWarning = node('p', '', 'study-account-storage-warning');
  storageWarning.hidden = true;
  const signInActions = node('div', '', 'study-account-actions');
  const google = button('Continue with Google', () => actions.signIn('google'));
  const apple = button('Continue with Apple', () => actions.signIn('apple'));
  google.hidden = !config.providers.google;
  apple.hidden = !config.providers.apple;
  signInActions.append(google, apple);
  const unavailable = node('p', 'Account sign-in is not available here yet. You can keep studying as a guest.', 'study-account-description');
  unavailable.hidden = config.providers.google || config.providers.apple;
  const accountActions = node('div', '', 'study-account-actions');
  const importButton = button('Import this browser’s progress', actions.importGuest);
  const retry = button('Retry sync', actions.retry);
  const signOut = button('Sign out', actions.signOut);
  signOut.classList.add('study-account-secondary');
  accountActions.append(importButton, retry, signOut);
  const importNote = node('p', 'Only import guest progress that belongs to you. This computer may have been used by someone else.', 'study-account-description');
  const conflict = node('div', '', 'study-account-conflict');
  const conflictText = node('p');
  const conflictActions = node('div', '', 'study-account-actions');
  const remote = button('Use saved account progress', () => actions.resolve('remote'));
  const local = button('Replace saved progress with this device', () => actions.resolve('local'));
  local.classList.add('study-account-secondary');
  conflictActions.append(remote, local);
  conflict.append(conflictText, conflictActions);
  container.replaceChildren(heading, description, identity, signInActions, unavailable, status, error, storageWarning, accountActions, importNote, conflict);
  return {
    error(message) {
      error.textContent = message || '';
      error.hidden = !message;
    },
    render(state, email, busy) {
      const signedIn = Boolean(state.userId);
      const loading = state.status === 'loading';
      heading.textContent = signedIn ? 'Your study account' : 'Save your study progress';
      description.hidden = signedIn;
      identity.hidden = !signedIn;
      identity.textContent = signedIn ? (email ? `Signed in as ${email}` : 'Signed in') : '';
      signInActions.hidden = signedIn;
      unavailable.hidden = signedIn || config.providers.google || config.providers.apple;
      status.textContent = statusText(state);
      storageWarning.textContent = state.error || '';
      storageWarning.hidden = !state.error;
      accountActions.hidden = !signedIn;
      importButton.hidden = !state.hasGuest;
      importNote.hidden = !signedIn || !state.hasGuest;
      retry.hidden = !['offline', 'error'].includes(state.status);
      conflict.hidden = state.status !== 'conflict';
      conflictText.textContent = state.conflict?.reset
        ? 'This account’s progress was reset on another device. Using the saved version keeps that reset. Replacing it restores this device’s progress to your account.'
        : 'Using the saved version replaces this device’s unsynced changes. Replacing the saved version keeps this device’s progress for your other devices.';
      for (const action of [google, apple, importButton, retry, remote, local]) action.disabled = Boolean(busy || loading);
      signOut.disabled = Boolean(busy);
    },
  };
}

export async function connectStudyAccount({ area, guestKey, initial, onChange }) {
  const config = configuration();
  const container = document.getElementById('study-account');
  if (!config || !container) return null;
  const supabase = accountClient(config);
  let currentUserId = null;
  let email = '';
  let epoch = 0;
  let busy = false;
  let destroyed = false;
  let forceGuest = false;
  const activeRequests = new Set();
  let storage;
  try { storage = localStorage; } catch { storage = undefined; }
  const store = createStudyStore({ area, guestKey, initial, storage, transport: createProgressTransport(supabase, () => currentUserId, activeRequests) });
  function abortRequests() {
    for (const request of activeRequests) request.abort();
    activeRequests.clear();
  }
  function render() { if (!destroyed) panel.render(store.snapshot(), email, busy); }
  async function action(work) {
    if (busy || destroyed) return;
    busy = true;
    panel.error('');
    render();
    try { await work(); } catch { panel.error('That action could not be completed. Your progress is still available on this page.'); }
    finally { busy = false; render(); }
  }
  async function setSession(session) {
    if (destroyed) return;
    if (forceGuest && session?.user?.id) return;
    const id = session?.user?.id || null;
    email = session?.user?.email || '';
    if (id === currentUserId) { render(); return; }
    epoch += 1;
    currentUserId = id;
    abortRequests();
    await store.setUser(id);
    render();
  }
  const panel = mountPanel(container, config, {
    signIn(provider) {
      return action(async () => {
        if (!config.providers[provider]) return;
        forceGuest = false;
        try {
          const probe = `${AUTH_STORAGE_KEY}.check`;
          localStorage.setItem(probe, '1');
          localStorage.removeItem(probe);
          sessionStorage.setItem(RETURN_STORAGE_KEY, safeStudyReturnPath(location.pathname + location.search + location.hash));
        } catch {
          panel.error('This browser is blocking sign-in storage. Allow site storage to sign in, or keep studying as a guest.');
          return;
        }
        const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + CALLBACK_PATH } });
        if (error) panel.error('Sign-in could not start. Please try again.');
      });
    },
    importGuest() {
      if (!confirm('Import this browser’s guest progress into your signed-in account? Only continue if this progress belongs to you.')) return;
      return action(() => store.importGuest());
    },
    retry() { return action(() => store.retry()); },
    resolve(choice) {
      const message = choice === 'local'
        ? 'Replace the saved account progress with this device’s version? Other devices will use this version after syncing.'
        : 'Use the saved account progress and discard this device’s unsynced changes?';
      if (!confirm(message)) return;
      return action(() => store.resolveConflict(choice));
    },
    signOut() {
      return action(async () => {
        const state = store.snapshot();
        if (['saving', 'offline', 'conflict', 'error'].includes(state.status) && !confirm('Some progress is not synced. Sign out now? It will stay in this browser’s account cache for your next sign-in.')) return;
        epoch += 1;
        forceGuest = true;
        currentUserId = null;
        email = '';
        abortRequests();
        await store.setUser(null);
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
          await supabase.auth.stopAutoRefresh();
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(`${AUTH_STORAGE_KEY}-code-verifier`);
          } catch {
            panel.error('Sign-out could not clear this browser’s sign-in storage. Close this browser profile before sharing this computer.');
            return;
          }
          panel.error('Signed out in this browser. The service could not confirm session revocation; reconnect before signing in again.');
        }
      });
    },
  });
  const unsubscribeStore = store.subscribe(state => {
    render();
    if (onChange) onChange(state.data, state);
  });
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    queueMicrotask(() => { void setSession(session).catch(() => panel.error('Your account could not be loaded. Please retry.')); });
  });
  const initialEpoch = epoch;
  try {
    const { data, error } = await accountDeadline(supabase.auth.getSession());
    if (error) panel.error('Sign-in status could not be checked. You can keep studying as a guest.');
    else if (initialEpoch === epoch) await setSession(data.session);
  } catch {
    panel.error('Sign-in status could not be checked. You can keep studying as a guest.');
  }
  const online = () => { if (store.snapshot().status === 'offline') void store.retry(); };
  const storageChanged = event => {
    if (event.key === AUTH_STORAGE_KEY && event.newValue === null) {
      forceGuest = true;
      void setSession(null);
    }
  };
  window.addEventListener('online', online);
  window.addEventListener('storage', storageChanged);
  return {
    ...store,
    destroy() {
      destroyed = true;
      abortRequests();
      unsubscribeStore();
      authListener.subscription.unsubscribe();
      window.removeEventListener('online', online);
      window.removeEventListener('storage', storageChanged);
      store.destroy();
    },
  };
}

export async function handleStudyAccountCallback() {
  const status = document.getElementById('study-account-callback-status');
  const setStatus = text => { if (status) status.textContent = text; };
  const config = configuration();
  if (!config || location.pathname !== CALLBACK_PATH) {
    setStatus('Account sign-in is not available here. You can return to study as a guest.');
    return;
  }
  const parameters = new URLSearchParams(location.search);
  const code = parameters.get('code');
  history.replaceState(null, '', CALLBACK_PATH);
  if (parameters.has('error') || !code) {
    setStatus('Sign-in was not completed. Return to your study page and try again.');
    return;
  }
  setStatus('Completing sign-in…');
  try {
    const supabase = accountClient(config);
    const { data, error } = await accountDeadline(supabase.auth.exchangeCodeForSession(code));
    if (error || !data.session) {
      setStatus('Sign-in could not be completed. Return to your study page and try again in the same browser.');
      return;
    }
    let returnPath = '/study/';
    try {
      returnPath = safeStudyReturnPath(sessionStorage.getItem(RETURN_STORAGE_KEY));
      sessionStorage.removeItem(RETURN_STORAGE_KEY);
    } catch { /* The study home remains a safe return destination. */ }
    setStatus('Signed in. Returning to your study page…');
    location.replace(returnPath);
  } catch {
    setStatus('Sign-in could not be completed. Return to your study page and try again.');
  }
}
