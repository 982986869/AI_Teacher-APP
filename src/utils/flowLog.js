// A loud, ordered trace of the account delete → restore flow, printed to the Metro
// console.
//
// Why this exists: this flow spans the app, the API and an email, and when it goes wrong
// the app shows one flat message ("Invalid email or password") that looks identical
// whether the password was wrong, the account was deleted, or — as happened once — the
// app was talking to a completely different server from the one being changed. Watching
// the steps go by is the fastest way to tell those apart on a real device, where there
// is no debugger and no server log in reach.
//
// Never pass a password or a restore code to this. The email address is fine: it is the
// tester's own, and it is the single most useful thing to see, because a normalised or
// mistyped address is its own class of bug here.

const on = process.env.NODE_ENV !== 'production';

export function flow(step, detail) {
  if (!on) return;
  console.log(`[FLOW] ${step}${detail ? '  —  ' + detail : ''}`);
}

// The shape every failed request in this flow should be read through: the status and the
// machine-readable code, which is what the screens actually branch on.
export function flowErr(step, e) {
  if (!on) return;
  const status = e?.response?.status ?? '(no response — network/URL problem)';
  const code = e?.response?.data?.code || '(none)';
  const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || '';
  console.log(`[FLOW] ${step}  —  status ${status} · code ${code} · "${msg}"`);
}
