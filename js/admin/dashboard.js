/* admin/dashboard.js — ringkasan data, pendaftar baru, grafik */
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

  /* Tabel pendaftar */
  function renderPendaftar() {
    const urut = pendaftar.slice().sort((a, b) => (a.status === 'Baru' ? 0 : 1) - (b.status === 'Baru' ? 0 : 1)).slice(0, 6);
    $('#tblPendaftar tbody').innerHTML = urut.map((p) => `
      <tr data-kode="${p.kode}">
        <td>${p.kode}</td>
        <td><strong>${esc(p.nama)}</strong></td>
        <td>${esc(namaProgram(p.program))}</td>
        <td>${Fmt.tanggal(p.tanggal)}</td>
        <td>${UI.badge(p.status)}</td>
        <td>${p.status === 'Baru'
          ? `<div class="actions"><button class="btn btn-ok btn-sm" data-act="terima">Terima</button><button class="btn btn-ghost btn-sm" data-act="tolak">Tolak</button></div>` : ''}</td>
      </tr>`).join('');
  }

  $('#tblPendaftar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const p = pendaftar.find((x) => x.kode === btn.closest('tr').dataset.kode);
    if (btn.dataset.act === 'tolak') {
      ask(`Tolak pendaftaran ${p.nama}?`, () => {
        p.status = 'Ditolak'; Store.set('pendaftar', pendaftar);
        renderPendaftar(); renderTodo(); UI.toast('Pendaftaran ditolak.', 'bad');
      }, 'Tolak');
    } else {
      // pendaftar diterima -> otomatis menjadi siswa + dibuatkan tagihan pendaftaran
      const id = Fmt.nextId('S', siswa);
      siswa.push({
        id, nama: p.nama, kelas: ['BHS', 'KRY'].includes(p.program) ? 'K-N5B' : 'K-N5A', program: p.program, bidang: p.bidang || '',
        telepon: p.telepon, email: p.email || '-', kota: p.kota || '-', lahir: p.lahir || '',
        status: 'Aktif', progres: 0, tahap: 0
      });
      bayar.push({ id: Fmt.nextId('INV', bayar), siswa: id, ket: 'Biaya pendaftaran', jumlah: 1000000, tanggal: Fmt.isoHariIni(), metode: '-', status: 'Belum' });
      p.status = 'Diterima';
      Store.set('siswa', siswa); Store.set('pembayaran', bayar); Store.set('pendaftar', pendaftar);
      renderStats(); renderPendaftar(); renderTodo(); renderProgram();
      UI.toast(`${p.nama} diterima sebagai siswa ${id}.`);
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
