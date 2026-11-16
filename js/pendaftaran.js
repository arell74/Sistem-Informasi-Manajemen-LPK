/* =====================================================
   pendaftaran.js — Validasi & penyimpanan formulir pendaftaran
   Data disimpan ke Store 'pendaftar' sehingga muncul
   di dashboard Admin (tanpa database).
   ===================================================== */
(function () {
  const form = $('#formDaftar');

  // Menu mobile (navbar sama dengan beranda)
  const toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('open'));

  // Isi pilihan program dari data
  $('#program').innerHTML = '<option value="">Pilih…</option>' + UI.options(DB.program, 'kode', 'nama');

  $('#bidang').innerHTML = '<option value="">Belum menentukan</option>' + BIDANG.map((b) => `<option>${b}</option>`).join('');

  // Batas tanggal lahir: minimal 18 tahun
  const lahir = $('#lahir');
  const batas = new Date(); batas.setFullYear(batas.getFullYear() - 18);
  lahir.max = batas.toLocaleDateString('sv-SE');

  // NIK hanya angka
  $('#nik').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });

  // Penghitung karakter motivasi
  const motivasi = $('#motivasi');
  motivasi.addEventListener('input', () => { $('#hitung').textContent = motivasi.value.length + ' karakter'; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) { UI.toast('Periksa kembali isian yang ditandai merah.', 'bad'); return; }

    const d = Form.data(form);
    const daftar = Store.get('pendaftar');
    const nomor = daftar.reduce((m, p) => Math.max(m, parseInt(p.kode.split('-')[1], 10) || 0), 0) + 1;
    const kode = 'REG-' + String(nomor).padStart(4, '0');

    daftar.unshift({
      kode, nama: d.nama.trim(), nik: d.nik, jk: d.jk, lahir: d.lahir, kota: d.kota.trim(),
      telepon: d.telepon, email: d.email.trim(), pendidikan: d.pendidikan,
      program: d.program, bidang: d.bidang, motivasi: d.motivasi.trim(),
      tanggal: Fmt.isoHariIni(), status: 'Baru', catatan: ''
    });
    Store.set('pendaftar', daftar);

    $('#formCard').innerHTML = `
      <div class="success">
        <div class="tick">${icon('check')}</div>
        <h2>Pendaftaran berhasil dikirim!</h2>
        <p class="muted">Terima kasih, <b>${esc(d.nama)}</b>. Simpan kode pendaftaranmu:</p>
        <div class="kode">${kode}</div>
        <p class="muted">Admin akan menghubungi kamu lewat WhatsApp <b>${esc(d.telepon)}</b>.</p>
        <a href="index.html" class="btn btn-ghost">Kembali ke Beranda</a>
        <a href="pendaftaran.html" class="btn btn-outline">Daftarkan orang lain</a>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
