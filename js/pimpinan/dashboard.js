/* pimpinan/dashboard.js — Dashboard Eksekutif & Laporan Makro Direktur LPK */
(function () {
  const me = Auth.user();
  $('#namaDirektur').textContent = me ? me.nama : 'Bapak Direktur';

  const siswa = Store.get('siswa') || [];
  const bayar = Store.get('pembayaran') || [];
  const mitra = Store.get('mitra') || [];
  const persetujuan = Store.get('persetujuan') || [];
  const logs = Store.get('audit_logs') || [];

  function renderStats() {
    const aktif = siswa.filter((s) => s.status === 'Aktif').length;
    const siap = siswa.filter((s) => s.status === 'Siap Berangkat').length;
    const totalUang = bayar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);
    const pendingApp = persetujuan.filter((p) => p.status === 'Menunggu').length;

    $('#statsEksekutif').innerHTML = [
      UI.stat('Siswa Aktif Pelatihan', aktif + ' Orang', 'users', 'navy', 'Di seluruh kelas N5 & N4'),
      UI.stat('Siap Berangkat ke Jepang', siap + ' Orang', 'plane', 'green', 'Tahap visa & penerbangan'),
      UI.stat('Realisasi Pembayaran Kas', Fmt.rupiah(totalUang), 'wallet', 'accent', 'Dari ' + bayar.filter((b) => b.status === 'Lunas').length + ' tagihan lunas'),
      UI.stat('Disposisi / Approval', pendingApp + ' Berkas', 'checksq', pendingApp ? 'amber' : 'ok', pendingApp ? 'Menunggu persetujuan direktur' : 'Semua disposisi tuntas')
    ].join('');
  }

  function renderPipeline() {
    const hitungTahap = TAHAP.map((t, idx) => ({
      tahap: t,
      jumlah: siswa.filter((s) => (s.tahap || 0) === idx).length
    }));

    $('#pipelineSteps').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.8rem">
        ${hitungTahap.map((h, i) => `
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:.85rem;text-align:center">
            <span class="badge ${h.jumlah ? 'badge-info' : 'badge-muted'}" style="margin-bottom:.4rem">Tahap ${i + 1}</span>
            <div style="font-size:.82rem;font-weight:600;color:#1E293B;min-height:2.4rem;display:flex;align-items:center;justify-content:center">${esc(h.tahap)}</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--accent);margin-top:.3rem">${h.jumlah} <small style="font-size:.76rem;color:#64748B;font-weight:normal">siswa</small></div>
          </div>
        `).join('')}
      </div>`;
  }

  function renderTodo() {
    const list = persetujuan.filter((p) => p.status === 'Menunggu');
    $('#todoPimpinan').innerHTML = list.length ? list.map((item) => `
      <li>
        <span class="count">${icon('clock')}</span>
        <div>
          <strong>${esc(item.jenis)}</strong>
          <small class="muted" style="display:block">${esc(item.catatan)}</small>
        </div>
        <a href="persetujuan.html" class="btn btn-outline btn-sm">Tinjau</a>
      </li>
    `).join('') : '<li style="color:#059669;padding:1rem">Semua berkas pengajuan telah ditindaklanjuti.</li>';
  }

  function renderMitra() {
    $('#badgeTotalMitra').textContent = mitra.length + ' Perusahaan';
    $('#tblMitraRingkas tbody').innerHTML = mitra.slice(0, 4).map((m) => `
      <tr>
        <td><strong>${esc(m.nama)}</strong><br><small class="muted">${esc(m.kanji || '')}</small></td>
        <td><span class="badge badge-info">${esc(m.prefektur.split(' ')[0])}</span></td>
        <td>${esc(m.bidang)}</td>
        <td style="text-align:right"><b>${m.terisi}</b> / ${m.kuota}</td>
      </tr>
    `).join('');
  }

  function renderFinansial() {
    const total = bayar.reduce((t, b) => t + b.jumlah, 0);
    const lunas = bayar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);
    const sisa = total - lunas;
    const persen = total ? Math.round(lunas / total * 100) : 0;

    $('#rekapFinansial').innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:.4rem;font-size:.88rem">
        <span>Kolektibilitas Biaya Pelatihan</span>
        <b>${persen}% (${Fmt.rupiah(lunas)} dari ${Fmt.rupiah(total)})</b>
      </div>
      <div class="progress ok" style="height:10px;margin-bottom:1.2rem"><i style="--v:${persen}%"></i></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:.84rem">
        <div style="background:#ECFDF5;padding:.8rem;border-radius:8px;border:1px solid #A7F3D0">
          <small style="color:#047857;display:block">Penerimaan Terverifikasi</small>
          <strong style="font-size:1.15rem;color:#065F46">${Fmt.rupiah(lunas)}</strong>
        </div>
        <div style="background:#FFFBEB;padding:.8rem;border-radius:8px;border:1px solid #FDE68A">
          <small style="color:#B45309;display:block">Sisa Piutang / Cicilan</small>
          <strong style="font-size:1.15rem;color:#92400E">${Fmt.rupiah(sisa)}</strong>
        </div>
      </div>`;
  }

  function renderAudit() {
    $('#tblAuditRingkas tbody').innerHTML = logs.slice(0, 4).map((l) => `
      <tr>
        <td><span class="audit-time">${Fmt.tanggal(l.waktu)}</span></td>
        <td><strong>${esc(l.aktor)}</strong></td>
        <td><span class="audit-category audit-cat-${esc(l.kategori)}">${esc(l.kategori)}</span></td>
        <td>${esc(l.aksi)}: <small class="muted">${esc(l.detail)}</small></td>
        <td style="text-align:right">${UI.badge(l.status)}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" class="empty">Belum ada riwayat log.</td></tr>';
  }

  // Cetak Ringkasan Eksekutif Resmi
  $('#btnCetakEksekutif').addEventListener('click', () => {
    const totalSiswa = siswa.length;
    const siapBerangkat = siswa.filter((s) => s.status === 'Siap Berangkat').length;
    const lunas = bayar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);

    const html = `
      <div class="doc-sheet">
        ${DocPrint.renderKop()}
        <h3 class="doc-title">RINGKASAN EKSEKUTIF KINERJA LEMBAGA (役員報告書)</h3>
        <p class="doc-subtitle">Laporan Manajerial Bulanan Sending Organization LPK Yuuki Training Center Indonesia</p>

        <div class="doc-meta">
          <div class="doc-meta-item"><b>Periode Laporan</b><span>: Bulan Berjalan (${Fmt.tanggalPanjang()})</span></div>
          <div class="doc-meta-item"><b>Penanggung Jawab</b><span>: Sopyan Komarudin, S.Kep. (Direktur)</span></div>
          <div class="doc-meta-item"><b>Total Peserta</b><span>: ${totalSiswa} Siswa Terdaftar</span></div>
          <div class="doc-meta-item"><b>Siap Terbang</b><span>: ${siapBerangkat} Siswa (Tahap Visa & CoE)</span></div>
        </div>

        <h4 style="margin:1.2rem 0 .5rem;font-size:.95rem">I. Ringkasan Finansial & Penerimaan</h4>
        <table class="doc-table">
          <thead>
            <tr><th>Uraian Rekapitulasi</th><th>Volume Transaksi</th><th style="text-align:right">Total Nominal</th></tr>
          </thead>
          <tbody>
            <tr><td>Total Dana Pelatihan Terkumpul (Kas Lunas)</td><td>${bayar.filter((b) => b.status === 'Lunas').length} Transaksi</td><td class="num"><strong>${Fmt.rupiah(lunas)}</strong></td></tr>
            <tr><td>Kemitraan Perusahaan Aktif di Jepang</td><td>${mitra.length} Kaisha & Kumiai</td><td class="num">Total Kuota: ${mitra.reduce((t, m) => t + m.kuota, 0)} Pekerja</td></tr>
          </tbody>
        </table>

        <h4 style="margin:1.2rem 0 .5rem;font-size:.95rem">II. Sebaran Mitra Perusahaan Jepang (Kaisha)</h4>
        <table class="doc-table">
          <thead>
            <tr><th>Perusahaan Penerima</th><th>Wilayah Jepang</th><th>Bidang Pekerjaan</th><th style="text-align:right">Kapasitas</th></tr>
          </thead>
          <tbody>
            ${mitra.map((m) => `<tr><td><b>${esc(m.nama)}</b></td><td>${esc(m.prefektur)}</td><td>${esc(m.bidang)}</td><td class="num">${m.terisi} / ${m.kuota}</td></tr>`).join('')}
          </tbody>
        </table>

        <div class="doc-sign-wrap">
          ${DocPrint.renderQR('YUK-DIR-EXEC-' + Fmt.isoHariIni().replace(/-/g, ''))}
          <div class="doc-signer">
            <p>Kuningan, ${Fmt.tanggalPanjang()}</p>
            <p style="font-weight:600;margin-top:.15rem">Direktur LPK Yuuki Training Center</p>
            <div class="doc-sign-space"></div>
            ${DocPrint.renderStempel('DISAHKAN')}
            <span class="doc-sign-name">Sopyan Komarudin, S.Kep.</span>
            <p style="font-size:.76rem;color:#64748B">Pimpinan Eksekutif</p>
          </div>
        </div>
      </div>`;

    DocPrint.showModal(html);
  });

  renderStats();
  renderPipeline();
  renderTodo();
  renderMitra();
  renderFinansial();
  renderAudit();
})();
