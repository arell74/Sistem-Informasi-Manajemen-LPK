/* siswa/berkas.js — unggah dokumen keberangkatan (status diverifikasi admin) */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  let semua = Store.get('berkas');
  let aktif = null;
  const MAKS = 2 * 1024 * 1024;
  const input = $('#pilihFile');

  // pastikan setiap jenis dokumen punya satu catatan untuk siswa ini
  DOKUMEN.forEach((d) => {
    if (!semua.some((b) => b.siswa === me.id && b.dokumen === d)) {
      semua.push({ id: Fmt.nextId('BK', semua), siswa: me.id, dokumen: d, file: '', tanggal: '', status: 'Belum upload', catatan: '' });
    }
  });
  Store.set('berkas', semua);

  const milik = () => DOKUMEN.map((d) => semua.find((b) => b.siswa === me.id && b.dokumen === d));

  function render() {
    const dok = milik();
    const ok = dok.filter((b) => b.status === 'Disetujui').length;
    const persen = Math.round(ok / dok.length * 100);
    $('#persen').textContent = `${ok} dari ${dok.length} disetujui`;
    $('#bar').style.setProperty('--v', persen + '%');
    $('#ket').textContent = ok === dok.length
      ? 'Semua berkas lengkap. Proses berlanjut ke seleksi & wawancara.'
      : 'Lengkapi semua dokumen agar proses keberangkatan dapat dilanjutkan.';

    $('#docGrid').innerHTML = dok.map((b) => {
      let tombol = '';
      if (b.status === 'Belum upload') tombol = `<button class="btn btn-sm" data-up="${esc(b.dokumen)}">${icon('upload')} Unggah</button>`;
      else if (b.status === 'Ditolak') tombol = `<button class="btn btn-sm" data-up="${esc(b.dokumen)}">${icon('upload')} Unggah ulang</button>`;
      else if (b.status === 'Menunggu') tombol = `<button class="btn btn-ghost btn-sm" data-up="${esc(b.dokumen)}">Ganti file</button>`;
      else tombol = '<span class="badge badge-ok">Terverifikasi</span>';
      return `<article class="card doc">
        <header><h4>${esc(b.dokumen)}</h4>${UI.badge(b.status)}</header>
        <div class="file">${b.file ? esc(b.file) + ' · ' + Fmt.tanggal(b.tanggal) : 'Belum ada file'}</div>
        ${b.status === 'Ditolak' && b.catatan ? `<div class="alert alert-bad" style="margin:0">${icon('x')}<span>${esc(b.catatan)}</span></div>` : ''}
        <div>${tombol}</div></article>`;
    }).join('');
  }

  $('#docGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-up]'); if (!btn) return;
    aktif = btn.dataset.up;
    input.click();
  });

  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { UI.toast('Format harus PDF, JPG, atau PNG.', 'bad'); input.value = ''; return; }
    if (file.size > MAKS) { UI.toast('Ukuran file maksimal 2 MB.', 'bad'); input.value = ''; return; }
    const b = semua.find((x) => x.siswa === me.id && x.dokumen === aktif);
    b.file = file.name; b.tanggal = Fmt.isoHariIni(); b.status = 'Menunggu'; b.catatan = '';
    Store.set('berkas', semua);
    input.value = '';
    render();
    UI.toast(`${aktif} terkirim dan menunggu verifikasi admin.`);
  });

  render();
})();
