// Offline cache: app shell first, CDN assets (Tailwind, fonts) cached on first load.
// Bump CACHE whenever you change any file so users get the new version.
const CACHE = 'sap1-v4';
const SHELL = [
    './', './index.html', './manifest.webmanifest', './icon.svg',
    './css/styles.css',
    './js/tailwind-config.js', './js/main.js', './js/simulator.js', './js/cpu.js',
    './js/state.js', './js/constants.js', './js/utils.js', './js/assembler.js',
    './js/sample.js', './js/runner.js', './js/ui.js', './js/pwa.js',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then((hit) => {
            if (hit) return hit;
            return fetch(e.request)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(e.request, copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'));
        })
    );
});
