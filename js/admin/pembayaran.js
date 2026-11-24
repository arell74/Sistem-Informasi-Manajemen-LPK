/* admin/pembayaran.js — rekap & verifikasi pembayaran siswa */
(function () {
  const siswa = Store.get('siswa');
  let bayar = Store.get('pembayaran');
  const namaSiswa = (id) => (siswa.find((s) => s.id === id) || { nama: id }).nama;
  const jumlah = (arr) => arr.reduce((t, b) => t + b.jumlah, 0);

  function renderStats() {
    const lunas = bayar.filter((b) => b.status === 'Lunas');
    const tunggu = bayar.filter((b) => b.status === 'Menunggu');
    const belum = bayar.filter((b) => b.status === 'Belum');
    $('#stats').innerHTML = [
      UI.stat('Terverifikasi', Fmt.rupiah(jumlah(lunas)), 'check', 'green', lunas.length + ' transaksi lunas'),
      UI.stat('Menunggu Verifikasi', Fmt.rupiah(jumlah(tunggu)), 'clock', 'amber', tunggu.length + ' bukti bayar'),
      UI.stat('Belum Dibayar', Fmt.rupiah(jumlah(belum)), 'wallet', 'accent', belum.length + ' tagihan')
    ].join('');
  }

  function render() {
    $('#tblBayar tbody').innerHTML = bayar.slice().reverse().map((b) => `
      <tr data-id="${b.id}">
        <td>${b.id}</td>
        <td><strong>${esc(namaSiswa(b.siswa))}</strong><br><small class="muted">${b.siswa}</small></td>
        <td>${esc(b.ket)}</td>
        <td class="num">${Fmt.rupiah(b.jumlah)}</td>
        <td>${Fmt.tanggal(b.tanggal)}<br><small class="muted">${esc(b.metode)}</small></td>
        <td>${UI.badge(b.status)}</td>
        <td><div class="actions">${aksi(b)}</div></td>
      </tr>`).join('');
    Table.refresh('#tblBayar');
    renderStats();
  }

  function aksi(b) {
    if (b.status === 'Menunggu') return `<button class="btn btn-ok btn-sm" data-act="ok">${icon('check')} Verifikasi</button><button class="btn btn-ghost btn-sm" data-act="no">Tolak</button>`;
    if (b.status === 'Belum') return `<button class="btn btn-ghost btn-sm" data-act="ingat">Kirim pengingat</button>`;
    return `<button class="btn btn-ghost btn-sm" data-act="kwitansi">${icon('printer')} Cetak Kwitansi</button>`;
  }

  $('#tblBayar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const b = bayar.find((x) => x.id === btn.closest('tr').dataset.id);
    const nama = namaSiswa(b.siswa);
    switch (btn.dataset.act) {
      case 'ok':
        b.status = 'Lunas';
        Store.set('pembayaran', bayar);
        AuditLog.record('pembayaran', 'Verifikasi Pembayaran', `Memverifikasi ${b.id} (${b.ket}) sejumlah ${Fmt.rupiah(b.jumlah)} milik ${nama} (${b.siswa}) sebagai Lunas.`, 'Sukses');
        render();
        UI.toast(`${b.id} (${nama}) diverifikasi lunas.`); break;
      case 'no':
        ask(`Tolak bukti pembayaran ${b.id} milik ${nama}? Status kembali menjadi belum dibayar.`, () => {
          b.status = 'Belum'; b.metode = '-';
          Store.set('pembayaran', bayar);
          AuditLog.record('pembayaran', 'Penolakan Bukti Bayar', `Menolak bukti pembayaran ${b.id} (${b.ket}) milik ${nama} (${b.siswa}).`, 'Perhatian');
          render();
          UI.toast('Bukti pembayaran ditolak.', 'bad');
        }, 'Tolak'); break;
      case 'ingat':
        AuditLog.record('pembayaran', 'Pengingat Pembayaran', `Mengirimkan notifikasi pengingat tagihan ${b.id} kepada ${nama}.`, 'Sukses');
        UI.toast(`Pengingat tagihan dikirim ke ${nama} (simulasi).`); break;
      case 'kwitansi':
        DocPrint.kwitansi(b, siswa.find((s) => s.id === b.siswa));
        break;
    }
  });

  render();
})();
