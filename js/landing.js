/* =====================================================
   landing.js — Interaksi halaman beranda
   - menu mobile
   - angka statistik berhitung saat terlihat
   - bayangan navbar saat scroll
   ===================================================== */
(function () {
  // Menu mobile
  const toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const buka = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', buka);
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  // Daftar bidang kerja (dari data.js)
  $('#daftarBidang').innerHTML = BIDANG.map((b) => `<li>${esc(b)}</li>`).join('');

  // Angka berhitung
  function hitung(el) {
    const target = Number(el.dataset.count), suffix = el.dataset.suffix || '';
    const durasi = 1200, mulai = performance.now();
    (function frame(now) {
      const t = Math.min((now - mulai) / durasi, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString('id-ID') + suffix;
      if (t < 1) requestAnimationFrame(frame);
    })(mulai);
  }
  const angka = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { hitung(en.target); io.unobserve(en.target); } });
    }, { threshold: .6 });
    angka.forEach((el) => io.observe(el));
  } else {
    angka.forEach((el) => { el.textContent = Number(el.dataset.count).toLocaleString('id-ID') + (el.dataset.suffix || ''); });
  }

  // Bayangan navbar
  const nav = $('.navbar');
  const onScroll = () => { nav.style.boxShadow = window.scrollY > 8 ? '0 4px 20px rgba(16,24,40,.08)' : 'none'; };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
