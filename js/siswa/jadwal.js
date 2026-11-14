/* siswa/jadwal.js — jadwal mingguan milik siswa (kelas utama + kelas umum) */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  const sensei = Store.get('sensei');
  const kelasSaya = [me.kelas].concat(KELAS_UMUM);
  const jadwal = Store.get('jadwal').filter((j) => kelasSaya.includes(j.kelas));
  const namaSensei = (id) => (sensei.find((t) => t.id === id) || {}).nama || id;
  const mulai = (jam) => jam.split('–')[0];
  const hariIni = Fmt.hariIni();

  $('#sub').textContent = `Kelas utama ${me.kelas} + kelas umum (${KELAS_UMUM.join(', ')}).`;

  $('#week').innerHTML = HARI.map((h) => {
    const slot = jadwal.filter((j) => j.hari === h).sort((a, b) => mulai(a.jam).localeCompare(mulai(b.jam)));
    return `<div class="week-day ${h === hariIni ? 'today' : ''}"><h4>${h}${h === hariIni ? '<span class="badge badge-ok">Hari ini</span>' : ''}</h4>
      ${slot.map((j) => `<div class="chip"><strong>${j.jam}</strong>${esc(j.mapel)}<small>${esc(namaSensei(j.sensei))}</small><small>${esc(j.ruang)}</small></div>`).join('') || '<small class="muted">Libur</small>'}</div>`;
  }).join('');

  const urut = jadwal.slice().sort((a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari) || mulai(a.jam).localeCompare(mulai(b.jam)));
  $('#tblJadwal tbody').innerHTML = urut.map((j) => `
    <tr><td><strong>${j.hari}</strong></td><td>${j.jam}</td><td>${esc(j.mapel)}</td><td>${esc(j.kelas)}</td><td>${esc(namaSensei(j.sensei))}</td><td>${esc(j.ruang)}</td></tr>`).join('');
})();
