/*
  sw.js — offline support.

  Strategy, chosen for a site that is still changing weekly:
    • navigations  → network first, fall back to the cached shell when offline.
      A stale index.html would pin an old app version on a device forever, which is
      the classic service-worker trap.
    • everything else (scripts, styles, icons) → cache first, refreshed in the
      background, so a mission loads instantly and works on a dead train.

  Bump CACHE on every release. Old caches are deleted on activate.
*/
const CACHE = 'inventorlab-rc8-1';
const SHELL = [
  './', './index.html', './style.css',
  './toolkit.js', './data.js', './deep_content.js', './concept_chapters.js',
  './assessment_bank.js', './virtual_labs.js', './retrieval_prompts.js',
  './studio_blueprints.js', './nokit_missions.js', './nokit_microbit.js', './nokit_engineer.js', './challenge_briefs.js', './app.js',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './icon-maskable-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      /* One bad URL must not fail the whole install, so add them individually. */
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch scratch.mit.edu etc.

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req)
        .then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
