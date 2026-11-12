// 오프라인 지원: 한 번 열면 게임 파일과 글꼴을 저장해 두고, 인터넷이 없으면 저장본으로 실행
// 게임 파일은 인터넷이 되면 항상 최신을 받아 오고(네트워크 우선), 글꼴은 저장본을 먼저 씀
const CACHE = 'rhythm-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !font) return;
  const save = res => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (font) { // 글꼴: 저장본 먼저, 없으면 받아서 저장
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save)));
    return;
  }
  // 게임 파일: 인터넷 먼저(최신), 안 되면 저장본
  e.respondWith(fetch(req).then(save).catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || caches.match('index.html'))));
});
