/* sensei/dashboard.js — ringkasan mengajar */
(function () {
  const user = Auth.user();
  const kelas = Store.get('kelas').filter((k) => k.sensei === user.id);
  const idKelas = kelas.map((k) => k.id);
  const siswa = Store.get('siswa').filter((s) => idKelas.includes(s.kelas));
  const jadwal = Store.get('jadwal');
  const nilai = Store.get('nilai');
  let pengumuman = Store.get('pengumuman');

  $('#namaSensei').textContent = user.nama.split(' ')[0];
  const hari = Fmt.hariIni();
  $('#hariIni').textContent = hari;

  const hariIni = jadwal.filter((j) => j.sensei === user.id && j.hari === hari)
    .sort((a, b) => a.jam.localeCompare(b.jam));

  // siswa yang nilainya belum lengkap (ada komponen kosong / 0)
  const belumDinilai = siswa.filter((s) => {
    const n = nilai[s.id];
    return !n || Object.values(n).some((v) => !v);
  }).length;

  $('#sapaan').textContent = hariIni.length
    ? `Hari ini kamu mengajar ${hariIni.length} kelas. Semangat!`
    : 'Tidak ada jadwal mengajar hari ini. Waktu yang pas untuk menyiapkan materi.';

  $('#stats').innerHTML = [
    UI.stat('Kelas Diampu', kelas.length, 'book', 'accent', idKelas.join(', ')),
    UI.stat('Total Siswa', siswa.length, 'users', 'green', 'di semua kelas saya'),
    UI.stat('Jadwal Hari Ini', hariIni.length, 'calendar', 'amber', hari),
    UI.stat('Belum Dinilai', belumDinilai, 'edit', 'navy', 'siswa dengan nilai belum lengkap')
  ].join('');

  $('#jadwalHariIni').innerHTML = hariIni.map((j) => {
    const k = kelas.find((x) => x.id === j.kelas);
    return `<div class="slot"><div class="slot-time">${j.jam}</div>
      <div><strong>${esc(j.mapel)}</strong><small>${esc(j.kelas)} · ${esc(j.ruang)} · ${siswa.filter((s) => s.kelas === j.kelas).length} siswa</small></div>
      <a class="btn btn-ghost btn-sm" style="margin-left:auto" href="absensi.html">Absensi</a></div>`;
  }).join('') || `<div class="empty">${icon('calendar')}<br>Tidak ada jadwal mengajar hari ini.</div>`;

  function renderPengumuman() {
    const untukSaya = pengumuman.filter((p) => ['Semua', 'Sensei'].includes(p.target) || idKelas.includes(p.target))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id)).slice(0, 4);
    $('#pengumuman').innerHTML = untukSaya.map((p) => `
      <div class="note"><header><h4>${esc(p.judul)}</h4><span class="badge badge-info">${esc(p.target)}</span></header>
      <p>${esc(p.isi)}</p><small>${Fmt.tanggal(p.tanggal)} · ${esc(p.penulis)}</small></div>`).join('') || '<div class="empty">Belum ada pengumuman.</div>';
  }

  $('#progresKelas').innerHTML = kelas.map((k) => {
    const s = siswa.filter((x) => x.kelas === k.id);
    const rata = s.length ? Math.round(s.reduce((t, x) => t + x.progres, 0) / s.length) : 0;
    return `<div style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:.3rem"><span><b>${k.id}</b> · ${esc(k.nama)} (${s.length} siswa)</span><b>${rata}%</b></div>
      <div class="progress"><i style="--v:${rata}%"></i></div></div>`;
  }).join('') || '<div class="empty">Belum ada kelas.</div>';

  // pengumuman ke kelas
  $('#u_kelas').innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);
  $('#formUmum').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(e.target)) return;
    const d = Form.data(e.target);
    pengumuman = Store.get('pengumuman');
    pengumuman.push({ id: Fmt.nextId('P', pengumuman), judul: d.judul.trim(), isi: d.isi.trim(), target: d.target, penulis: user.nama, tanggal: Fmt.isoHariIni() });
    Store.set('pengumuman', pengumuman);
    Form.reset(e.target); Modal.close($('#modalUmum')); renderPengumuman();
    UI.toast(`Pengumuman terkirim ke kelas ${d.target}.`);
  });

  renderPengumuman();
})();
