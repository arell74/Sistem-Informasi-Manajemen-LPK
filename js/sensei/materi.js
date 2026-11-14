/* sensei/materi.js — unggah & kelola materi (simulasi: hanya metadata berkas) */
(function () {
  const user = Auth.user();
  const kelas = Store.get('kelas').filter((k) => k.sensei === user.id);
  let materi = Store.get('materi');
  const MAKS = 20 * 1024 * 1024;

  $('#kelas').innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);

  const ukuran = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  const milikSaya = () => materi.filter((m) => m.oleh === user.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));

  function render() {
    const daftar = milikSaya();
    $('#jumlah').textContent = daftar.length + ' materi';
    $('#tblMateri tbody').innerHTML = daftar.map((m) => `
      <tr data-id="${m.id}">
        <td><strong>${esc(m.judul)}</strong></td>
        <td>${esc(m.kelas)}</td>
        <td><span class="badge badge-info">${esc(m.jenis)}</span></td>
        <td>${esc(m.ukuran)}</td>
        <td>${Fmt.tanggal(m.tanggal)}</td>
        <td><div class="actions"><button class="btn btn-ghost btn-sm" data-del aria-label="Hapus materi">${icon('trash')}</button></div></td>
      </tr>`).join('');
    Table.refresh('#tblMateri');
  }

  $('#tblMateri').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]'); if (!btn) return;
    const id = btn.closest('tr').dataset.id;
    ask('Hapus materi ini? Siswa tidak akan bisa mengunduhnya lagi.', () => {
      materi = materi.filter((m) => m.id !== id);
      Store.set('materi', materi); render(); UI.toast('Materi dihapus.', 'bad');
    }, 'Hapus');
  });

  $('#formMateri').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target, file = form.elements.berkas.files[0];
    form.elements.berkas.setCustomValidity(file && file.size > MAKS ? 'Ukuran file melebihi 20 MB.' : '');
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    materi.push({ id: Fmt.nextId('M', materi), judul: d.judul.trim(), kelas: d.kelas, jenis: d.jenis, ukuran: ukuran(file.size), tanggal: Fmt.isoHariIni(), oleh: user.id, file: file.name });
    Store.set('materi', materi);
    Form.reset(form); render();
    UI.toast('Materi berhasil diunggah.');
  });
  $('#berkas').addEventListener('change', (e) => e.target.setCustomValidity(''));

  render();
})();
