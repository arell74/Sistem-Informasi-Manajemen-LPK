/* admin/pengumuman.js — kirim & kelola pengumuman */
(function () {
  let daftar = Store.get('pengumuman');
  const kelas = Store.get('kelas');
  const user = Auth.user();

  $('#target').innerHTML = ['Semua', 'Siswa', 'Sensei'].map((t) => `<option>${t}</option>`).join('')
    + kelas.map((k) => `<option value="${k.id}">Kelas ${k.id} — ${esc(k.nama)}</option>`).join('');

  function render() {
    const urut = daftar.slice().sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));
    $('#jumlah').textContent = urut.length + ' pengumuman';
    $('#daftar').innerHTML = urut.map((p) => `
      <div class="note" data-id="${p.id}">
        <header><h4>${esc(p.judul)}</h4>
          <span style="display:flex;gap:.4rem;align-items:center"><span class="badge badge-info">${esc(p.target)}</span>
          <button class="btn btn-ghost btn-sm" data-del aria-label="Hapus pengumuman">${icon('trash')}</button></span></header>
        <p>${esc(p.isi)}</p><small>${Fmt.tanggal(p.tanggal)} · ${esc(p.penulis)}</small>
      </div>`).join('') || '<div class="empty">Belum ada pengumuman.</div>';
  }

  $('#daftar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]'); if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    ask('Hapus pengumuman ini?', () => {
      daftar = daftar.filter((p) => p.id !== id);
      Store.set('pengumuman', daftar); render(); UI.toast('Pengumuman dihapus.', 'bad');
    }, 'Hapus');
  });

  $('#formPengumuman').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(e.target)) return;
    const d = Form.data(e.target);
    daftar.push({ id: Fmt.nextId('P', daftar), judul: d.judul.trim(), isi: d.isi.trim(), target: d.target, penulis: user.nama, tanggal: Fmt.isoHariIni() });
    Store.set('pengumuman', daftar);
    Form.reset(e.target); render();
    UI.toast('Pengumuman terkirim ke ' + d.target + '.');
  });

  render();
})();
