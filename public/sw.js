const CACHE_NAME = 'pulse-shell-v1';
const BASE_PATH = new URL('./', self.registration.scope).pathname.replace(/\/$/, '');
const SHELL = [`${BASE_PATH}/`, `${BASE_PATH}/manifest.webmanifest`, `${BASE_PATH}/icon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((response) => response || caches.match('/'))));
});
