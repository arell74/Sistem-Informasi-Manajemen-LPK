/* =====================================================
   sw.js — Service Worker untuk Yuuki Portal (PWA)
   Mendukung instalasi di smartphone & akses offline
   ===================================================== */

const CACHE_NAME = 'yuuki-portal-v1';

// Berkas inti yang di-precache agar portal dapat dibuka saat offline
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './login.html',
  './pendaftaran.html',
  './manifest.json',

  // CSS
  './css/style.css',
  './css/dashboard.css',
  './css/public.css',
  './css/admin.css',
  './css/sensei.css',
  './css/siswa.css',
  './css/pimpinan.css',

  // Core JS
  './js/data.js',
  './js/app.js',
  './js/guard.js',
  './js/landing.js',
  './js/login.js',
  './js/pendaftaran.js',
  './js/profil.js',

  // Siswa Module (Krusial untuk akses jadwal & materi offline)
  './siswa/dashboard.html',
  './siswa/jadwal.html',
  './siswa/materi.html',
  './siswa/nilai.html',
  './siswa/pembayaran.html',
  './siswa/berkas.html',
  './siswa/profil.html',
  './js/siswa/dashboard.js',
  './js/siswa/jadwal.js',
  './js/siswa/materi.js',
  './js/siswa/nilai.js',
  './js/siswa/pembayaran.js',
  './js/siswa/berkas.js',

  // Admin Module
  './admin/dashboard.html',
  './admin/data-siswa.html',
  './admin/data-sensei.html',
  './admin/kelas-jadwal.html',
  './admin/mitra-jepang.html',
  './admin/pembayaran.html',
  './admin/verifikasi-berkas.html',
  './admin/pengumuman.html',
  './admin/profil.html',
  './js/admin/dashboard.js',
  './js/admin/data-siswa.js',
  './js/admin/data-sensei.js',
  './js/admin/kelas-jadwal.js',
  './js/admin/mitra-jepang.js',
  './js/admin/pembayaran.js',
  './js/admin/verifikasi-berkas.js',
  './js/admin/pengumuman.js',

  // Pimpinan Module (Direktur LPK)
  './pimpinan/dashboard.html',
  './pimpinan/persetujuan.html',
  './pimpinan/laporan.html',
  './pimpinan/profil.html',
  './js/pimpinan/dashboard.js',
  './js/pimpinan/persetujuan.js',
  './js/pimpinan/laporan.js',

  // Sensei Module
  './sensei/dashboard.html',
  './sensei/kelas-saya.html',
  './sensei/absensi.html',
  './sensei/input-nilai.html',
  './sensei/materi.html',
  './sensei/profil.html',
  './js/sensei/dashboard.js',
  './js/sensei/kelas-saya.js',
  './js/sensei/absensi.js',
  './js/sensei/input-nilai.js',
  './js/sensei/materi.js',

  // Aset Gambar & Logo
  './img/logo.png',
  './img/logo-mark.svg',
  './img/logo-mark.png',
  './img/logo-white.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-192.png',
  './img/icon-maskable-512.png'
];

/* 1. Install Event: Unduh dan simpan aset dasar ke Cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Menggunakan addAll bertahap agar kegagalan 1 file non-kritis tidak membatalkan install
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(url))
      );
    }).then(() => self.skipWaiting())
  );
});

/* 2. Activate Event: Bersihkan cache versi lama */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

/* 3. Fetch Event: Strategi Network-First untuk Dokumen HTML, Cache-First untuk Aset Statis */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Abaikan request non-GET dan protokol di luar http/https
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // A. Untuk navigasi dokumen HTML (Halaman): Coba jaringan dulu, jika offline fallback ke cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;

          // Jika halaman spesifik belum dicache, kembalikan halaman siswa atau index yang ada di cache
          const fallback = await caches.match('./siswa/dashboard.html') || await caches.match('./index.html');
          if (fallback) return fallback;

          // Halaman offline darurat sederhana jika cache kosong total
          return new Response(
            `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mode Offline · Yuuki Portal</title><style>body{font-family:sans-serif;text-align:center;padding:3rem 1rem;background:#F8FAFC;color:#0F172A}h2{color:#C8102E}p{color:#64748B}a{display:inline-block;margin-top:1rem;padding:.6rem 1.2rem;background:#C8102E;color:#fff;text-decoration:none;border-radius:6px}</style></head><body><h2>Koneksi Terputus (Mode Offline)</h2><p>Anda sedang tidak terhubung ke jaringan internet. Halaman yang pernah Anda buka tetap dapat diakses dari riwayat browser.</p><a href="./index.html">Ke Halaman Utama</a></body></html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // B. Untuk Aset Statis (CSS, JS, Gambar, Font): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => {
        // Gagal jaringan pada background update diabaikan jika sudah ada cache
      });

      return cachedRes || fetchPromise;
    })
  );
});
