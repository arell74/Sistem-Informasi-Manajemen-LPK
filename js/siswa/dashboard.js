/* siswa/dashboard.js — ringkasan belajar, status keberangkatan, jadwal hari ini */
(function () {
  const user = Auth.user();
  const me = Store.get('siswa').find((s) => s.id === user.id);
  if (!me) { $('.content').innerHTML = '<div class="alert alert-bad">Data siswa tidak ditemukan. Hubungi admin.</div>'; return; }

  const kelasSaya = [me.kelas].concat(KELAS_UMUM);
  const sensei = Store.get('sensei');
  const nilai = Store.get('nilai')[me.id];
  const bayar = Store.get('pembayaran').filter((b) => b.siswa === me.id);
  const absensi = Store.get('absensi');
  const program = DB.program.find((p) => p.kode === me.program);

  $('#namaSiswa').textContent = me.nama.split(' ')[0];
  $('#sapaan').textContent = `Kelas ${me.kelas} · ${program ? program.nama : me.program}${me.bidang ? ' · Bidang ' + me.bidang : ''}. Terus semangat belajar!`;

  /* statistik */
  const rata = nilai ? Math.round(Object.values(nilai).reduce((a, b) => a + b, 0) / Object.values(nilai).length) : null;
  const total = bayar.reduce((t, b) => t + b.jumlah, 0);
  const lunas = bayar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);

  let hadir = 0, catatan = 0;
  Object.values(absensi).forEach((hari) => { if (hari[me.id]) { catatan++; if (hari[me.id] === 'Hadir') hadir++; } });

  $('#stats').innerHTML = [
    UI.stat('Progres Belajar', me.progres + '%', 'book', 'accent', 'menuju siap tes'),
    UI.stat('Rata-rata Nilai', rata === null ? '-' : rata, 'award', 'blue', rata === null ? 'belum ada nilai' : 'dari 5 komponen'),
    UI.stat('Kehadiran', catatan ? Math.round(hadir / catatan * 100) + '%' : '-', 'checksq', 'green', catatan ? `${hadir} dari ${catatan} pertemuan` : 'belum ada data absensi'),
    UI.stat('Sisa Tagihan', Fmt.rupiah(total - lunas), 'wallet', 'amber', total ? `terbayar ${Fmt.rupiah(lunas)}` : '')
  ].join('');

  /* stepper keberangkatan */
  $('#stepper').innerHTML = TAHAP.map((t, i) => `<div class="step ${i < me.tahap ? 'done' : i === me.tahap ? 'current' : ''}">${t}</div>`).join('');
  $('#tahapSekarang').textContent = 'Tahap ' + (me.tahap + 1) + ' dari ' + TAHAP.length + ': ' + TAHAP[me.tahap];

  /* Informasi Penempatan Kerja & Tracking Dokumen Imigrasi (CoE) */
  const cardPenempatanEl = $('#cardPenempatan');
  if (cardPenempatanEl) {
    const mitraList = Store.get('mitra') || [];
    const kaisha = mitraList.find((m) => m.id === me.mitra);

    if (kaisha) {
      cardPenempatanEl.innerHTML = `
        <div class="card-head" style="margin-bottom:.8rem">
          <div>
            <h3>Penempatan Kerja di Jepang & Status Imigrasi (CoE)</h3>
            <p class="muted text-sm" style="margin:.15rem 0 0">Informasi resmi Accepting Organization (*Kaisha*) dan perkembangan dokumen izin tinggal di Jepang.</p>
          </div>
          <span class="badge badge-ok">${esc(me.status_seleksi || 'Lolos Wawancara')}</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.2rem;background:#F8FAFC;padding:1.1rem;border-radius:10px;border:1px solid #E2E8F0">
          <div>
            <small class="muted" style="font-size:.76rem;text-transform:uppercase;font-weight:600;display:block">Perusahaan Penerima (Kaisha)</small>
            <strong style="font-size:1rem;color:#0F172A;display:block;margin-top:.15rem">${esc(kaisha.nama)}</strong>
            <small style="color:#C8102E;font-family:'Noto Sans JP';font-weight:600">${esc(kaisha.kanji || '')}</small>
          </div>
          <div>
            <small class="muted" style="font-size:.76rem;text-transform:uppercase;font-weight:600;display:block">Wilayah / Prefektur</small>
            <strong style="font-size:1rem;color:#0F172A;display:block;margin-top:.15rem">📍 ${esc(kaisha.prefektur)}</strong>
            <small class="muted">${esc(kaisha.kumiai)}</small>
          </div>
          <div>
            <small class="muted" style="font-size:.76rem;text-transform:uppercase;font-weight:600;display:block">Standar Gaji Pokok & Asrama</small>
            <strong style="font-size:1rem;color:#059669;display:block;margin-top:.15rem">¥${Number(kaisha.gaji || 0).toLocaleString('ja-JP')} / bulan</strong>
            <small class="muted">${esc(kaisha.asrama || 'Tersedia')}</small>
          </div>
          <div>
            <small class="muted" style="font-size:.76rem;text-transform:uppercase;font-weight:600;display:block">Nomor CoE & Target Terbang</small>
            <code style="font-size:.85rem;color:#2563EB;display:block;margin-top:.15rem">${esc(me.no_coe || '-')}</code>
            <small style="font-weight:600;color:#0F172A">✈️ Estimasi: ${esc(me.target_terbang || '-')}</small>
          </div>
        </div>

        <div style="background:#FFFFFF;border:1px dashed #CBD5E1;border-radius:8px;padding:.85rem 1.1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.8rem">
          <div style="display:flex;align-items:center;gap:.7rem">
            <span style="font-size:1.3rem">🛂</span>
            <div>
              <b style="font-size:.88rem;color:#0F172A">Status Proses Imigrasi Jepang:</b>
              <span style="margin-left:.4rem;color:#0F766E;font-weight:600;font-size:.86rem">${esc(me.tahap_imigrasi || 'Pemeriksaan Dokumen')}</span>
            </div>
          </div>
          <span class="badge badge-info" style="font-size:.78rem">Diperbarui oleh SO LPK Yuuki</span>
        </div>`;
    } else {
      cardPenempatanEl.innerHTML = `
        <div class="card-head">
          <div>
            <h3>Penempatan Kerja di Jepang (*Matching Kaisha*)</h3>
            <p class="muted text-sm" style="margin:.15rem 0 0">Status pencocokan dengan perusahaan mitra dan persiapan wawancara kerja.</p>
          </div>
          <span class="badge badge-warn">Tahap Pembinaan Bahasa</span>
        </div>
        <div style="background:#F8FAFC;padding:1.1rem;border-radius:8px;border:1px solid #E2E8F0;font-size:.86rem;line-height:1.5;color:#475569">
          Saat ini Anda sedang dalam tahap <b>Pelatihan Bahasa & Budaya Jepang</b>. Setelah menyelesaikan evaluasi kelas dan mencapai standar kelulusan bahasa (N5/N4), data profil Anda akan dimasukkan ke dalam bursa seleksi wawancara kerja (*Mensetsu*) bersama mitra <b>Accepting Organizations (Kaisha & Kumiai)</b> di Jepang.
        </div>`;
    }
  }

  /* jadwal hari ini */
  const hari = Fmt.hariIni();
  $('#hariIni').textContent = hari;
  const hariIni = Store.get('jadwal').filter((j) => j.hari === hari && kelasSaya.includes(j.kelas)).sort((a, b) => a.jam.localeCompare(b.jam));
  $('#jadwalHariIni').innerHTML = hariIni.map((j) => {
    const t = sensei.find((x) => x.id === j.sensei);
    return `<div class="slot"><div class="slot-time">${j.jam}</div><div><strong>${esc(j.mapel)}</strong><small>${esc(t ? t.nama : '')} · ${esc(j.ruang)}</small></div></div>`;
  }).join('') || `<div class="empty">${icon('calendar')}<br>Tidak ada kelas hari ini. Manfaatkan untuk mengulang materi!</div>`;

  /* ring progres */
  $('#ring').style.setProperty('--p', me.progres);
  $('#ring b').textContent = me.progres + '%';
  $('#targetInfo').textContent = 'Target: lulus ujian bahasa Jepang sesuai persyaratan perusahaan penerima.';

  /* pengumuman */
  const untukSaya = Store.get('pengumuman').filter((p) => ['Semua', 'Siswa'].includes(p.target) || kelasSaya.includes(p.target))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id)).slice(0, 4);
  $('#pengumuman').innerHTML = untukSaya.map((p) => `
    <div class="note"><header><h4>${esc(p.judul)}</h4><span class="badge badge-info">${esc(p.target)}</span></header>
    <p>${esc(p.isi)}</p><small>${Fmt.tanggal(p.tanggal)} · ${esc(p.penulis)}</small></div>`).join('') || '<div class="empty">Belum ada pengumuman.</div>';
})();
