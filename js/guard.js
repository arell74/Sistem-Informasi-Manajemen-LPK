/* =====================================================
   guard.js — Penjaga hak akses halaman
   Dipasang di <head> halaman dashboard supaya pengecekan
   berjalan SEBELUM halaman tampil. Jika sesi kosong atau
   peran tidak cocok, pengguna dialihkan ke halaman login.
   ===================================================== */
(function () {
  var role = document.documentElement.dataset.role;
  if (!role) return; // halaman publik tidak perlu dijaga

  var sesi = null;
  try { sesi = JSON.parse(localStorage.getItem('yuuki_session')); } catch (e) {}

  if (!sesi) {
    location.replace('../login.html?need=1');
  } else if (sesi.role !== role) {
    location.replace('../login.html?denied=1');
  }
})();
