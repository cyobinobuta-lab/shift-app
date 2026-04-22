// Service Worker — オフラインキャッシュと速度改善
const CACHE_NAME = "shift-app-v24";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./api.js",
  "./config.js",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon.png"
];

// インストール時にキャッシュ生成
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(() => {
        // エラーが起きてもインストール完了させる
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチをインターセプト
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // APIリクエストはネットワークファースト
  if (url.hostname === "script.google.com" || url.pathname.includes("macros")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 成功したAPIレスポンスはキャッシュに保存
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから復帰
          return caches.match(request);
        })
    );
  } else {
    // 静的ファイル（HTML, CSS, JS）はキャッシュファースト
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(response => {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
          return response;
        });
      })
    );
  }
});
