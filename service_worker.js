// Menggunakan timestamp dinamis agar nama cache selalu baru setiap kali sw.js diunduh ulang oleh browser
const CACHE_NAME = 'setoranku-auto-' + new Date().getTime();

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo-app-icon.png',
  './logo-dashboard.png'
];

// 1. Tahap Install: Langsung simpan aset dan lewati masa tunggu (skipWaiting)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Memaksa Service Worker baru langsung aktif tanpa menunggu pengguna menutup browser/tab
  self.skipWaiting();
});

// 2. Tahap Activate: Otomatis HAPUS SEMUA CACHE LAMA yang namanya tidak cocok
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Langsung mengambil alih semua tab yang sedang terbuka
  self.clients.claim();
});

// 3. Tahap Fetch: Strategi Network-First (Utamakan Ambil File Terbaru dari Server)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika ada jaringan dan berhasil dapat data gres dari GitHub, perbarui isi cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika offline/tanpa internet, barulah ambil dari cache
        return caches.match(event.request);
      })
  );
});