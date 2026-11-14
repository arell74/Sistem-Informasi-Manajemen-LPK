/* sensei/kelas-saya.js — daftar kelas yang diampu + daftar siswanya */
(function () {
  const user = Auth.user();
  const kelas = Store.get('kelas').filter((k) => k.sensei === user.id);
  const siswa = Store.get('siswa');
  const jadwal = Store.get('jadwal');
  const nilai = Store.get('nilai');

  const rata = (id) => {
    const n = nilai[id]; if (!n) return null;
    const v = Object.values(n); return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
  };

  $('#kelasGrid').innerHTML = kelas.map((k) => {
    const s = siswa.filter((x) => x.kelas === k.id);
    const jam = jadwal.filter((j) => j.kelas === k.id).map((j) => `${j.hari.slice(0, 3)} ${j.jam}`).join(' · ');
    const pr = s.length ? Math.round(s.reduce((t, x) => t + x.progres, 0) / s.length) : 0;
    return `<article class="card" data-id="${k.id}">
      <div class="card-head"><h3>${esc(k.nama)}</h3><span class="badge badge-info">${esc(k.level)}</span></div>
      <dl class="kv" style="margin-bottom:1rem">
        <dt>ID</dt><dd>${k.id}</dd>
        <dt>Ruang</dt><dd>${esc(k.ruang)}</dd>
        <dt>Siswa</dt><dd>${s.length} / ${k.kuota}</dd>
        <dt>Jadwal</dt><dd>${jam || '-'}</dd>
      </dl>
      <div class="progress-row" style="margin-bottom:1rem"><span class="text-sm muted">Progres</span><div class="progress"><i style="--v:${pr}%"></i></div><b>${pr}%</b></div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn btn-sm" data-lihat>${icon('users')} Lihat Siswa</button>
        <a class="btn btn-ghost btn-sm" href="absensi.html">Absensi</a>
        <a class="btn btn-ghost btn-sm" href="input-nilai.html">Nilai</a>
      </div></article>`;
  }).join('') || '<div class="empty card">Kamu belum mengampu kelas.</div>';

  $('#kelasGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lihat]'); if (!btn) return;
    const k = kelas.find((x) => x.id === btn.closest('[data-id]').dataset.id);
    const s = siswa.filter((x) => x.kelas === k.id);
    $('#judulKelas').textContent = `Siswa ${k.nama} (${s.length})`;
    $('#tblSiswa tbody').innerHTML = s.map((x) => {
      const r = rata(x.id);
      return `<tr><td>${x.id}</td>
        <td><div class="cell-user">${UI.avatar(x.nama)}<strong>${esc(x.nama)}</strong></div></td>
        <td><div class="progress-row"><div class="progress"><i style="--v:${x.progres}%"></i></div><b>${x.progres}%</b></div></td>
        <td>${r === null ? '-' : r}</td><td>${UI.badge(x.status)}</td></tr>`;
    }).join('') || '<tr><td colspan="5" class="muted" style="text-align:center;padding:1.5rem">Belum ada siswa di kelas ini.</td></tr>';
    Modal.open('#modalSiswa');
  });
})();
