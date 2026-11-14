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
