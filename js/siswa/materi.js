/* siswa/materi.js — materi hanya untuk kelas milik siswa; unduh = berkas contoh */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  const kelasSaya = [me.kelas].concat(KELAS_UMUM);
  const materi = Store.get('materi').filter((m) => kelasSaya.includes(m.kelas))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));

  $('#tblMateri tbody').innerHTML = materi.map((m) => `
    <tr data-id="${m.id}">
      <td><strong>${esc(m.judul)}</strong></td>
      <td>${esc(m.kelas)}</td>
      <td>${esc(m.jenis)}</td>
      <td>${esc(m.ukuran)}</td>
      <td>${Fmt.tanggal(m.tanggal)}</td>
      <td><div class="actions"><button class="btn btn-sm" data-unduh>${icon('download')} Unduh</button></div></td>
    </tr>`).join('');
  Table.refresh('#tblMateri');

  $('#tblMateri').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unduh]'); if (!btn) return;
    const m = materi.find((x) => x.id === btn.closest('tr').dataset.id);
    UI.download(m.judul.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.txt',
      `${m.judul}\nKelas: ${m.kelas} · Jenis: ${m.jenis}\n\n(Berkas contoh. Pada sistem sebenarnya, di sinilah file materi diunduh.)\n`);
    UI.toast(`Mengunduh "${m.judul}"…`);
  });
})();
