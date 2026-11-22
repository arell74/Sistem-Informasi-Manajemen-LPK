/* siswa/pembayaran.js — tagihan milik siswa + unggah bukti pembayaran */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  let semua = Store.get('pembayaran');
  let aktif = null;
  const MAKS = 2 * 1024 * 1024;

  const milik = () => semua.filter((b) => b.siswa === me.id);

  function render() {
    const daftar = milik();
    const total = daftar.reduce((t, b) => t + b.jumlah, 0);
    const lunas = daftar.filter((b) => b.status === 'Lunas').reduce((t, b) => t + b.jumlah, 0);
    const tunggu = daftar.filter((b) => b.status === 'Menunggu').reduce((t, b) => t + b.jumlah, 0);
    const persen = total ? Math.round(lunas / total * 100) : 0;

    $('#stats').innerHTML = [
      UI.stat('Total Biaya', Fmt.rupiah(total), 'wallet', 'navy'),
      UI.stat('Sudah Lunas', Fmt.rupiah(lunas), 'check', 'green'),
      UI.stat('Menunggu Verifikasi', Fmt.rupiah(tunggu), 'clock', 'amber'),
      UI.stat('Sisa Tagihan', Fmt.rupiah(total - lunas), 'plane', 'accent')
    ].join('');
    $('#persen').textContent = persen + '%';
    $('#barBayar').style.setProperty('--v', persen + '%');

    $('#tblBayar tbody').innerHTML = daftar.map((b) => `
      <tr data-id="${b.id}">
        <td>${b.id}</td><td><strong>${esc(b.ket)}</strong></td>
        <td class="num">${Fmt.rupiah(b.jumlah)}</td>
        <td>${Fmt.tanggal(b.tanggal)}${b.metode !== '-' ? `<br><small class="muted">${esc(b.metode)}</small>` : ''}</td>
        <td>${UI.badge(b.status)}</td>
        <td><div class="actions">${b.status === 'Belum' ? `<button class="btn btn-sm" data-bukti>${icon('upload')} Unggah bukti</button>`
          : b.status === 'Lunas' ? `<button class="btn btn-ghost btn-sm" data-kwitansi>${icon('download')} Kwitansi</button>` : '<span class="muted text-sm">Diperiksa admin</span>'}</div></td>
      </tr>`).join('') || '<tr><td colspan="6" class="muted" style="text-align:center;padding:2rem">Belum ada tagihan.</td></tr>';
  }

  $('#tblBayar').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const b = semua.find((x) => x.id === tr.dataset.id);
    if (e.target.closest('[data-bukti]')) {
      aktif = b;
      Form.reset($('#formBukti'));
      $('#buktiInfo').textContent = `${b.id} — ${b.ket} (${Fmt.rupiah(b.jumlah)})`;
      Modal.open('#modalBukti');
    } else if (e.target.closest('[data-kwitansi]')) {
      UI.download(`kwitansi-${b.id}.txt`, `KWITANSI PEMBAYARAN — LPK YUUKI\n\nNo. Invoice : ${b.id}\nDiterima dari: ${me.nama} (${me.id})\nUntuk        : ${b.ket}\nJumlah       : ${Fmt.rupiah(b.jumlah)}\nStatus       : LUNAS\n\n(Dokumen ini diterbitkan secara otomatis oleh sistem LPK Yuuki Training Center Indonesia)\n`);
    }
  });

  $('#formBukti').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target, file = form.elements.bukti.files[0];
    form.elements.bukti.setCustomValidity(file && file.size > MAKS ? 'Ukuran file maksimal 2 MB.' : '');
    if (!Form.validate(form)) return;
    aktif.status = 'Menunggu';
    aktif.metode = Form.data(form).metode;
    aktif.tanggal = Fmt.isoHariIni();
    Store.set('pembayaran', semua);
    Modal.close($('#modalBukti')); render();
    UI.toast('Bukti pembayaran terkirim. Admin akan memverifikasi.');
  });
  $('#bukti').addEventListener('change', (e) => e.target.setCustomValidity(''));

  render();
})();
