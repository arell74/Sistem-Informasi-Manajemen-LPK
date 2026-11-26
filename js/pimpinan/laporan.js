/* pimpinan/laporan.js — Rekapitulasi laporan kinerja lembaga untuk Disnaker / Kemenaker */
(function () {
  const siswa = Store.get('siswa') || [];
  const mitra = Store.get('mitra') || [];
  const program = DB.program || [];
  const bayar = Store.get('pembayaran') || [];

  function renderStats() {
    const totalSiswa = siswa.length;
    const siapTerbang = siswa.filter((s) => s.status === 'Siap Berangkat').length;
    const totalMitra = mitra.length;
    const totalUang = bayar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);

    $('#statsLaporan').innerHTML = [
      UI.stat('Total Binaan Pelatihan', totalSiswa + ' Orang', 'users', 'navy', 'Seluruh angkatan berjalan'),
      UI.stat('Siap Magang ke Jepang', siapTerbang + ' Orang', 'plane', 'green', 'Lolos seleksi & visa'),
      UI.stat('Mitra Kaisha Aktif', totalMitra + ' Perusahaan', 'award', 'amber', 'Wilayah Kanto & Kansai'),
      UI.stat('Kas Penerimaan LPK', Fmt.rupiah(totalUang), 'wallet', 'accent', 'Status terverifikasi lunas')
    ].join('');
  }

  function renderPeserta() {
    $('#tblRekapPeserta tbody').innerHTML = program.map((p) => {
      const perProg = siswa.filter((s) => s.program === p.kode);
      const aktif = perProg.filter((s) => s.status === 'Aktif').length;
      const siap = perProg.filter((s) => s.status === 'Siap Berangkat').length;
      const cuti = perProg.filter((s) => s.status === 'Cuti').length;

      return `
        <tr>
          <td><strong>${esc(p.nama)}</strong> (${esc(p.kode)})</td>
          <td class="num" style="font-weight:700">${perProg.length}</td>
          <td class="num" style="color:#0D9488;font-weight:600">${aktif}</td>
          <td class="num" style="color:#059669;font-weight:700">${siap}</td>
          <td class="num" style="color:#94A3B8">${cuti}</td>
        </tr>`;
    }).join('');
  }

  function renderMitra() {
    $('#tblRekapMitra tbody').innerHTML = mitra.map((m) => `
      <tr>
        <td><strong>${esc(m.nama)}</strong><br><small class="muted">${esc(m.kanji || '')}</small></td>
        <td>${esc(m.kumiai)}</td>
        <td><span class="badge badge-info">${esc(m.prefektur)}</span></td>
        <td>${esc(m.bidang)}</td>
        <td class="num" style="font-weight:600">¥${Number(m.gaji || 0).toLocaleString('ja-JP')}</td>
        <td class="num"><b>${m.terisi}</b> / ${m.kuota}</td>
      </tr>
    `).join('');
  }

  $('#btnCetakLaporan').addEventListener('click', () => {
    const html = `
      <div class="doc-sheet">
        ${DocPrint.renderKop()}
        <h3 class="doc-title">LAPORAN KINERJA LEMBAGA & EVALUASI PROGRAM KERJA (業務実績報告書)</h3>
        <p class="doc-subtitle">Nomor: 042/SO-YUK/LAP-KIN/${new Date().getFullYear()} — Dokumen Resmi LPK Yuuki Training Center Indonesia</p>

        <div class="doc-meta">
          <div class="doc-meta-item"><b>Periode Penilaian</b><span>: Semester Berjalan 2026</span></div>
          <div class="doc-meta-item"><b>Penanggung Jawab</b><span>: Sopyan Komarudin, S.Kep. (Direktur)</span></div>
          <div class="doc-meta-item"><b>Badan Akreditasi</b><span>: SO Kemenaker RI / Disnaker Jawa Barat</span></div>
          <div class="doc-meta-item"><b>Tanggal Penerbitan</b><span>: ${Fmt.tanggalPanjang()}</span></div>
        </div>

        <h4 style="margin:1.3rem 0 .5rem;font-size:.95rem">I. Rekapitulasi Pembinaan Siswa & Angka Keberangkatan</h4>
        <table class="doc-table">
          <thead>
            <tr><th>Program Pelatihan</th><th style="text-align:right">Total</th><th style="text-align:right">Aktif Belajar</th><th style="text-align:right">Siap Berangkat</th></tr>
          </thead>
          <tbody>
            ${program.map((p) => {
              const perProg = siswa.filter((s) => s.program === p.kode);
              const aktif = perProg.filter((s) => s.status === 'Aktif').length;
              const siap = perProg.filter((s) => s.status === 'Siap Berangkat').length;
              return `<tr><td><b>${esc(p.nama)}</b></td><td class="num">${perProg.length}</td><td class="num">${aktif}</td><td class="num"><b>${siap}</b></td></tr>`;
            }).join('')}
          </tbody>
        </table>

        <h4 style="margin:1.3rem 0 .5rem;font-size:.95rem">II. Kemitraan Perusahaan Penerima di Jepang (Accepting Organizations)</h4>
        <table class="doc-table">
          <thead>
            <tr><th>Perusahaan Penerima</th><th>Wilayah / Prefektur</th><th>Bidang Usaha</th><th style="text-align:right">Standar Gaji</th><th style="text-align:right">Penyerapan</th></tr>
          </thead>
          <tbody>
            ${mitra.map((m) => `<tr><td><b>${esc(m.nama)}</b></td><td>${esc(m.prefektur)}</td><td>${esc(m.bidang)}</td><td class="num">¥${Number(m.gaji || 0).toLocaleString('ja-JP')}</td><td class="num"><b>${m.terisi}</b> / ${m.kuota}</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="doc-sign-wrap">
          ${DocPrint.renderQR('YUK-REPORT-SO-2026')}
          <div class="doc-signer">
            <p>Kuningan, ${Fmt.tanggalPanjang()}</p>
            <p style="font-weight:600;margin-top:.15rem">Direktur LPK Yuuki Training Center</p>
            <div class="doc-sign-space"></div>
            ${DocPrint.renderStempel('DISAHKAN')}
            <span class="doc-sign-name">Sopyan Komarudin, S.Kep.</span>
            <p style="font-size:.76rem;color:#64748B">Pimpinan Sending Organization</p>
          </div>
        </div>
      </div>`;

    DocPrint.showModal(html);
  });

  renderStats();
  renderPeserta();
  renderMitra();
})();
