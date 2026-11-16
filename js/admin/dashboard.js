/* admin/dashboard.js — ringkasan data, verifikasi pendaftar baru, grafik */
(function () {
  $('#adminName').textContent = Auth.user().nama.split(' ')[0];

  const siswa = Store.get('siswa'), sensei = Store.get('sensei'), kelas = Store.get('kelas');
  const bayar = Store.get('pembayaran'), berkas = Store.get('berkas');
  const pendaftar = Store.get('pendaftar'), pengumuman = Store.get('pengumuman');
  const namaProgram = (kode) => (DB.program.find((p) => p.kode === kode) || {}).nama || kode;

  /* Kartu statistik */
  function renderStats() {
    $('#stats').innerHTML = [
      UI.stat('Total Siswa', siswa.length, 'users', 'accent', siswa.filter((s) => s.status === 'Aktif').length + ' aktif belajar'),
      UI.stat('Sensei', sensei.length, 'user', 'blue', sensei.filter((s) => s.status === 'Aktif').length + ' aktif mengajar'),
      UI.stat('Kelas Aktif', kelas.length, 'book', 'amber', kelas.filter((k) => k.jenis === 'utama').length + ' kelas utama'),
      UI.stat('Siap Berangkat', siswa.filter((s) => s.status === 'Siap Berangkat').length, 'plane', 'green', 'tahap akhir proses')
    ].join('');
  }

  /* ---------- Pemeriksaan otomatis pendaftar ----------
     Hanya alat bantu: memeriksa kewajaran isian (NIK, tanggal lahir, kontak, motivasi)
     supaya admin cepat melihat mana yang perlu dicurigai. Keputusan tetap di tangan admin. */
  const KODE_PROVINSI = new Set(['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '31', '32', '33', '34', '35', '36', '51', '52', '53', '61', '62', '63', '64', '65', '71', '72', '73', '74', '75', '76', '81', '82', '91', '92', '93', '94', '95', '96']);
  const POLA_KETIK = /qwer|wert|erty|rtyu|tyui|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm/i;
  const EMAIL_SEKALI_PAKAI = /@(mailinator|guerrillamail|tempmail|temp-mail|yopmail|10minutemail|trashmail|sharklasers|dispostable|maildrop|getnada)\./i;
  const angka = (s) => String(s || '').replace(/\D/g, '');
  const nol = (n) => String(n).padStart(2, '0');
  const noHp = (s) => { const d = angka(s); return d.startsWith('62') ? '0' + d.slice(2) : d; };
  const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function usiaDari(lahirIso) {
    const m = ISO_RE.exec(lahirIso || ''); if (!m) return null;
    const h = new Date();
    let u = h.getFullYear() - +m[1];
    if (h.getMonth() + 1 < +m[2] || (h.getMonth() + 1 === +m[2] && h.getDate() < +m[3])) u--;
    return u;
  }

  /* membaca tanggal lahir & jenis kelamin yang tersimpan di dalam NIK */
  function bacaNik(nik) {
    let hari = +nik.slice(6, 8); const bulan = +nik.slice(8, 10), tahun = +nik.slice(10, 12);
    const jk = hari > 40 ? 'P' : 'L';
    if (hari > 40) hari -= 40;
    const valid = hari >= 1 && hari <= 31 && bulan >= 1 && bulan <= 12;
    return { hari, bulan, tahun, jk, valid };
  }

  function periksa(p) {
    const cek = [];
    const tambah = (label, status, pesan) => cek.push({ label, status, pesan });
    const nik = angka(p.nik), hp = noHp(p.telepon);

    // 1. Nama
    const kata = (p.nama || '').trim().split(/\s+/).filter(Boolean);
    if (/[^A-Za-zÀ-ÿ.'\- ]/.test(p.nama || '') || POLA_KETIK.test(p.nama || '') || /\b(test|tes|testing|admin|xxx|aaa)\b/i.test(p.nama || ''))
      tambah('Nama', 'bad', 'Mengandung angka/simbol atau terlihat seperti ketikan asal.');
    else if (kata.length < 2) tambah('Nama', 'warn', 'Hanya satu kata; nama di KTP biasanya lebih lengkap.');
    else if (kata.some((k) => k.length >= 4 && !/[aeiou]/i.test(k))) tambah('Nama', 'warn', 'Ada kata yang tidak lazim sebagai nama.');
    else tambah('Nama', 'ok', 'Penulisan nama wajar.');

    // 2. Format NIK
    let nikOk = false;
    if (!/^\d{16}$/.test(nik)) tambah('Format NIK', 'bad', 'NIK harus 16 digit angka.');
    else if (!KODE_PROVINSI.has(nik.slice(0, 2))) tambah('Format NIK', 'bad', `Kode provinsi ${nik.slice(0, 2)} tidak dikenal.`);
    else if (/^(\d)\1+$/.test(nik) || /1234567890|0123456789|9876543210/.test(nik)) tambah('Format NIK', 'bad', 'NIK berpola berurutan/berulang, tidak seperti NIK asli.');
    else { tambah('Format NIK', 'ok', `16 digit, kode provinsi ${nik.slice(0, 2)} dikenal.`); nikOk = true; }

    // 3-4. NIK dibandingkan dengan tanggal lahir & jenis kelamin
    if (/^\d{16}$/.test(nik)) {
      const n = bacaNik(nik), l = ISO_RE.exec(p.lahir || '');
      if (!n.valid) tambah('NIK ↔ tanggal lahir', 'bad', 'Tanggal lahir di dalam NIK tidak valid.');
      else if (l && (n.hari !== +l[3] || n.bulan !== +l[2] || n.tahun !== +l[1] % 100))
        tambah('NIK ↔ tanggal lahir', 'bad', `NIK mencatat lahir ${nol(n.hari)}-${nol(n.bulan)}-${nol(n.tahun)}, formulir ${Fmt.tanggal(p.lahir)}.`);
      else tambah('NIK ↔ tanggal lahir', 'ok', 'Tanggal lahir pada NIK sama dengan formulir.');
      if (n.valid) {
        if (n.jk !== p.jk) tambah('NIK ↔ jenis kelamin', 'bad', `NIK menunjukkan ${n.jk === 'P' ? 'perempuan' : 'laki-laki'}, formulir ${p.jk === 'P' ? 'perempuan' : 'laki-laki'}.`);
        else tambah('NIK ↔ jenis kelamin', 'ok', 'Jenis kelamin pada NIK sama dengan formulir.');
      }
    }

    // 5. Usia
    const usia = usiaDari(p.lahir);
    if (usia === null) tambah('Usia', 'bad', 'Tanggal lahir tidak terbaca.');
    else if (usia < 18) tambah('Usia', 'bad', `${usia} tahun, di bawah batas minimal 18 tahun.`);
    else if (usia > 35) tambah('Usia', 'warn', `${usia} tahun, di atas rentang umum program (18–35).`);
    else tambah('Usia', 'ok', `${usia} tahun, sesuai rentang program.`);

    // 6. Telepon
    if (!/^08\d{8,12}$/.test(hp)) tambah('Telepon', 'bad', 'Bukan format nomor seluler Indonesia (08xxxxxxxxxx).');
    else if (/(\d)\1{4,}/.test(hp) || /12345678|87654321/.test(hp)) tambah('Telepon', 'warn', 'Pola angka berulang/berurutan, mungkin nomor asal.');
    else tambah('Telepon', 'ok', 'Format nomor seluler wajar.');

    // 7. Email
    const lokal = (p.email || '').split('@')[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '')) tambah('Email', 'bad', 'Format email tidak valid.');
    else if (EMAIL_SEKALI_PAKAI.test(p.email)) tambah('Email', 'bad', 'Memakai layanan email sekali pakai.');
    else if (POLA_KETIK.test(lokal)) tambah('Email', 'warn', 'Nama email terlihat seperti ketikan asal.');
    else tambah('Email', 'ok', 'Format email wajar.');

    // 8. Motivasi
    const teks = (p.motivasi || '').trim(), kataM = teks.toLowerCase().split(/\s+/).filter(Boolean);
    const unik = new Set(kataM).size;
    if (POLA_KETIK.test(teks) || /(.)\1{4,}/.test(teks)) tambah('Motivasi', 'bad', 'Terlihat seperti ketikan acak, bukan alasan yang sebenarnya.');
    else if (kataM.length >= 4 && unik / kataM.length < 0.5) tambah('Motivasi', 'warn', 'Banyak kata yang diulang-ulang.');
    else if (teks.length < 40) tambah('Motivasi', 'warn', 'Terlalu singkat untuk menilai kesungguhan.');
    else tambah('Motivasi', 'ok', 'Alasan ditulis dengan kalimat yang jelas.');

    // 9. Data kembar (pendaftar lain / siswa yang sudah ada)
    const kembar = [];
    pendaftar.filter((x) => x.kode !== p.kode).forEach((x) => {
      if (nikOk && angka(x.nik) === nik) kembar.push(`NIK sama dengan ${x.kode} (${x.nama})`);
      if (noHp(x.telepon) === hp) kembar.push(`telepon sama dengan ${x.kode} (${x.nama})`);
      if (p.email && (x.email || '').toLowerCase() === p.email.toLowerCase()) kembar.push(`email sama dengan ${x.kode} (${x.nama})`);
    });
    if (p.status !== 'Diterima') siswa.forEach((s) => {
      if (noHp(s.telepon) === hp) kembar.push(`telepon sama dengan siswa ${s.id} (${s.nama})`);
      if (p.email && (s.email || '').toLowerCase() === p.email.toLowerCase()) kembar.push(`email sama dengan siswa ${s.id} (${s.nama})`);
    });
    if (kembar.length) tambah('Data kembar', 'bad', kembar.join('; ') + '.');
    else tambah('Data kembar', 'ok', 'Tidak ada pendaftar/siswa lain dengan data yang sama.');

    const skor = cek.reduce((t, c) => t + (c.status === 'bad' ? 2 : c.status === 'warn' ? 1 : 0), 0);
    const masalah = cek.filter((c) => c.status !== 'ok').length;
    const v = skor >= 4
      ? { nama: 'Mencurigakan', tone: 'bad', teks: 'Banyak isian yang janggal. Kemungkinan iseng atau data palsu; sebaiknya tolak atau minta verifikasi ulang.' }
      : skor >= 1
        ? { nama: 'Perlu dicek', tone: 'warn', teks: `Ada ${masalah} hal yang perlu dikonfirmasi. Hubungi pendaftar lewat WhatsApp dan minta foto KTP sebelum memutuskan.` }
        : { nama: 'Meyakinkan', tone: 'ok', teks: 'Semua pemeriksaan otomatis lolos. Tetap cocokkan dengan KTP asli saat pendaftar datang atau dihubungi.' };
    return { cek, skor, masalah, ...v };
  }

  const badgeLayak = (r) => `<span class="badge badge-${r.tone}">${r.nama}</span>`;

  /* Tabel pendaftar */
  function renderPendaftar() {
    const urut = pendaftar.slice().sort((a, b) => (a.status === 'Baru' ? 0 : 1) - (b.status === 'Baru' ? 0 : 1)).slice(0, 6);
    $('#tblPendaftar tbody').innerHTML = urut.map((p) => `
      <tr data-kode="${p.kode}">
        <td>${p.kode}</td>
        <td><strong>${esc(p.nama)}</strong><small class="sub">${Fmt.tanggal(p.tanggal)}</small></td>
        <td>${esc(namaProgram(p.program))}</td>
        <td>${badgeLayak(periksa(p))}</td>
        <td>${UI.badge(p.status)}</td>
        <td><button class="btn ${p.status === 'Baru' ? '' : 'btn-ghost'} btn-sm" data-act="detail">${p.status === 'Baru' ? 'Periksa' : 'Detail'}</button></td>
      </tr>`).join('');
  }

  /* Modal detail & verifikasi */
  let aktif = null;
  const nilai = (v) => (v ? esc(v) : '<span class="muted">—</span>');

  function bukaDetail(kode) {
    const p = pendaftar.find((x) => x.kode === kode); if (!p) return;
    const r = periksa(p), baru = p.status === 'Baru';
    aktif = p;
    const hp = noHp(p.telepon);
    const pesanWa = `Halo ${p.nama}, kami dari LPK Yuuki. Kami menerima pendaftaran Anda (${p.kode}). Boleh kami minta foto KTP untuk verifikasi data? Terima kasih.`;
    const waUrl = `https://wa.me/62${hp.slice(1)}?text=${encodeURIComponent(pesanWa)}`;
    const usia = usiaDari(p.lahir);
    $('#pdJudul').textContent = `Detail Pendaftar · ${p.kode}`;
    $('#pdBody').innerHTML = `
      <div class="pd-head">
        ${UI.avatar(p.nama, 'lg')}
        <div><h4>${esc(p.nama)}</h4><p class="muted">Mendaftar ${Fmt.tanggal(p.tanggal)} · ${UI.badge(p.status)}</p></div>
      </div>
      <div class="verdict verdict-${r.tone}" role="status">
        <b>${r.nama}</b><span>${r.teks}</span>
        <small>Skor kecurigaan ${r.skor} · pemeriksaan otomatis hanya alat bantu, keputusan tetap di tangan admin.</small>
      </div>
      <div class="detail-grid">
        <section>
          <h5>Data pendaftar</h5>
          <dl class="kv">
            <dt>NIK</dt><dd>${nilai(p.nik)}</dd>
            <dt>Tanggal lahir</dt><dd>${p.lahir ? Fmt.tanggal(p.lahir) + (usia !== null ? ` (${usia} th)` : '') : '—'}</dd>
            <dt>Jenis kelamin</dt><dd>${p.jk === 'P' ? 'Perempuan' : p.jk === 'L' ? 'Laki-laki' : '—'}</dd>
            <dt>Kota asal</dt><dd>${nilai(p.kota)}</dd>
            <dt>Telepon</dt><dd>${nilai(p.telepon)}</dd>
            <dt>Email</dt><dd>${nilai(p.email)}</dd>
            <dt>Pendidikan</dt><dd>${nilai(p.pendidikan)}</dd>
            <dt>Program</dt><dd>${esc(namaProgram(p.program))}</dd>
            <dt>Bidang kerja</dt><dd>${nilai(p.bidang)}</dd>
          </dl>
        </section>
        <section>
          <h5>Hasil pemeriksaan</h5>
          <ul class="cek-list">${r.cek.map((c) => `
            <li class="cek cek-${c.status}"><span class="cek-ic" aria-hidden="true">${c.status === 'ok' ? '✓' : c.status === 'warn' ? '!' : '✕'}</span>
              <div><b>${c.label}</b><small>${esc(c.pesan)}</small></div></li>`).join('')}</ul>
        </section>
      </div>
      <h5>Motivasi mendaftar</h5>
      <blockquote class="motivasi">${p.motivasi ? esc(p.motivasi) : '<span class="muted">Tidak diisi.</span>'}</blockquote>
      <div class="field" id="pdCatatanField">
        <label for="pdCatatan">${baru ? 'Catatan admin (wajib diisi bila menolak)' : 'Catatan admin'}</label>
        <textarea class="textarea" id="pdCatatan" rows="3" ${baru ? '' : 'readonly'} placeholder="Contoh: sudah dihubungi lewat WhatsApp, menunggu foto KTP.">${esc(p.catatan || '')}</textarea>
      </div>`;
    $('#pdFoot').innerHTML = baru
      ? `<button type="button" class="btn btn-ghost" data-close>Tutup</button>
         <button type="button" class="btn btn-ghost" data-pd="simpan">Simpan catatan</button>
         <a class="btn btn-ghost" href="${waUrl}" target="_blank" rel="noopener">Hubungi WhatsApp</a>
         <button type="button" class="btn btn-danger" data-pd="tolak">Tolak</button>
         <button type="button" class="btn btn-ok" data-pd="terima">Terima</button>`
      : `<button type="button" class="btn btn-ghost" data-close>Tutup</button>
         <a class="btn btn-ghost" href="${waUrl}" target="_blank" rel="noopener">Hubungi WhatsApp</a>`;
    Modal.open('#modalPendaftar');
    setTimeout(() => { $('#pdBody').scrollTop = 0; }, 60);
  }

  const tutupDetail = () => { Modal.close($('#modalPendaftar')); aktif = null; };
  const catatan = () => $('#pdCatatan').value.trim();

  function terima(p) {
    // pendaftar diterima -> otomatis menjadi siswa + dibuatkan tagihan pendaftaran
    const id = Fmt.nextId('S', siswa);
    siswa.push({
      id, nama: p.nama, kelas: ['BHS', 'KRY'].includes(p.program) ? 'K-N5B' : 'K-N5A', program: p.program, bidang: p.bidang || '',
      telepon: p.telepon, email: p.email || '-', kota: p.kota || '-', lahir: p.lahir || '',
      status: 'Aktif', progres: 0, tahap: 0
    });
    bayar.push({ id: Fmt.nextId('INV', bayar), siswa: id, ket: 'Biaya pendaftaran', jumlah: 1000000, tanggal: Fmt.isoHariIni(), metode: '-', status: 'Belum' });
    p.status = 'Diterima'; p.catatan = catatan();
    Store.set('siswa', siswa); Store.set('pembayaran', bayar); Store.set('pendaftar', pendaftar);
    tutupDetail(); renderStats(); renderPendaftar(); renderTodo(); renderProgram();
    UI.toast(`${p.nama} diterima sebagai siswa ${id}.`);
  }

  function tolak(p, alasan) {
    p.status = 'Ditolak'; p.catatan = alasan;
    Store.set('pendaftar', pendaftar);
    tutupDetail(); renderPendaftar(); renderTodo();
    UI.toast('Pendaftaran ditolak.', 'bad');
  }

  $('#tblPendaftar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act="detail"]'); if (btn) bukaDetail(btn.closest('tr').dataset.kode);
  });

  $('#modalPendaftar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-pd]'); if (!btn || !aktif) return;
    const p = aktif, aksi = btn.dataset.pd;
    if (aksi === 'simpan') {
      p.catatan = catatan(); Store.set('pendaftar', pendaftar);
      UI.toast('Catatan disimpan.');
    } else if (aksi === 'tolak') {
      const alasan = catatan();
      if (!alasan) {
        Form.setError($('#pdCatatanField'), 'Tulis alasan penolakan terlebih dahulu.');
        $('#pdCatatan').focus(); return;
      }
      ask(`Tolak pendaftaran ${p.nama}?`, () => tolak(p, alasan), 'Tolak');
    } else if (aksi === 'terima') {
      const r = periksa(p);
      if (r.tone === 'bad') ask(`${p.nama} ditandai "${r.nama}" oleh pemeriksaan otomatis. Tetap diterima sebagai siswa?`, () => terima(p), 'Tetap terima', 'ok');
      else terima(p);
    }
  });

  /* Perlu tindakan */
  function renderTodo() {
    const item = [
      { n: pendaftar.filter((p) => p.status === 'Baru').length, t: 'Pendaftar baru menunggu keputusan', href: '#tblPendaftar', l: 'Tinjau' },
      { n: bayar.filter((b) => b.status === 'Menunggu').length, t: 'Pembayaran menunggu verifikasi', href: 'pembayaran.html', l: 'Verifikasi' },
      { n: berkas.filter((b) => b.status === 'Menunggu').length, t: 'Berkas menunggu verifikasi', href: 'verifikasi-berkas.html', l: 'Periksa' },
      { n: siswa.filter((s) => s.status === 'Cuti').length, t: 'Siswa berstatus cuti', href: 'data-siswa.html', l: 'Lihat' }
    ];
    $('#todo').innerHTML = item.map((i) => `<li><span class="count ${i.n ? '' : 'zero'}">${i.n}</span><span>${i.t}</span><a href="${i.href}">${i.l} →</a></li>`).join('');
  }

  /* Grafik batang pendaftar per bulan */
  function renderBars() {
    const data = Store.get('statistik');
    const maks = Math.max(...data.map((d) => d.n));
    $('#bars').innerHTML = data.map((d) => `<div class="bar"><b>${d.n}</b><i style="--h:${Math.round(d.n / maks * 100)}%"></i><span>${d.bulan}</span></div>`).join('');
  }

  /* Siswa per program */
  function renderProgram() {
    $('#programBars').innerHTML = DB.program.map((p) => {
      const n = siswa.filter((s) => s.program === p.kode).length;
      return `<div style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:.3rem"><span>${esc(p.nama)}</span><b>${n}</b></div>
        <div class="progress"><i style="--v:${siswa.length ? Math.round(n / siswa.length * 100) : 0}%"></i></div></div>`;
    }).join('');
  }

  /* Pengumuman terbaru */
  function renderPengumuman() {
    const terbaru = pengumuman.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 3);
    $('#pengumuman').innerHTML = terbaru.map((p) => `
      <div class="note"><header><h4>${esc(p.judul)}</h4><span class="badge badge-info">${esc(p.target)}</span></header>
      <p>${esc(p.isi)}</p><small>${Fmt.tanggal(p.tanggal)} · ${esc(p.penulis)}</small></div>`).join('') || '<div class="empty">Belum ada pengumuman.</div>';
  }

  renderStats(); renderPendaftar(); renderTodo(); renderBars(); renderProgram(); renderPengumuman();
})();
