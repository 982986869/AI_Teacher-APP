// src/navigation/aiTeacherLauncher.js
// "Open the AI Teacher" from outside Home (the dock's AI Teacher button).
//
// The AI Teacher is not a route — HomeScreen opens it in place (the same screen
// "Start learning" opens). So the dock switches to Home and then calls
// requestAITeacher(); Home subscribes with onAITeacherRequest() and opens it.
//
// A direct signal rather than a navigation param: it does not depend on how the
// navigator merges or replaces params, and if Home is not listening yet (still
// mounting) the request is held and delivered the moment it subscribes.

let pending = false;
const listeners = new Set();

export function requestAITeacher() {
  if (listeners.size === 0) { pending = true; return; }
  listeners.forEach((fn) => { try { fn(); } catch (_) { /* a broken listener must not block the others */ } });
}

export function onAITeacherRequest(fn) {
  listeners.add(fn);
  if (pending) { pending = false; fn(); }
  return () => { listeners.delete(fn); };
}
