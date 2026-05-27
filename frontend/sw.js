// Service Workerを無効化（旧バージョンのキャッシュをクリア）
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// フェッチは何もしない（ブラウザに任せる）
self.addEventListener("fetch", () => {});
