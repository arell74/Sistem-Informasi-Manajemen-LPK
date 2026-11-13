/* admin/verifikasi-berkas.js — verifikasi dokumen keberangkatan siswa */
(function () {
  let siswa = Store.get('siswa');
  let berkas = Store.get('berkas');
  const namaSiswa = (id) => (siswa.find((s) => s.id === id) || { nama: id }).nama;
  let sedangDitolak = null;

  $('#filterDok').insertAdjacentHTML('beforeend', DOKUMEN.map((d) => `<option>${d}</option>`).join(''));

  function renderStats() {
    const hitung = (st) => berkas.filter((b) => b.status === st).length;
    $('#stats').innerHTML = [
      UI.stat('Menunggu', hitung('Menunggu'), 'clock', 'amber', 'perlu diperiksa'),
      UI.stat('Disetujui', hitung('Disetujui'), 'check', 'green'),
      UI.stat('Ditolak', hitung('Ditolak'), 'x', 'accent', 'menunggu unggah ulang'),
      UI.stat('Belum Upload', hitung('Belum upload'), 'upload', 'navy')
    ].join('');
  }

  function render() {
    $('#tblBerkas tbody').innerHTML = berkas.map((b) => `
      <tr data-id="${b.id}">
        <td><strong>${esc(namaSiswa(b.siswa))}</strong><br><small class="muted">${b.siswa}</small></td>
        <td>${esc(b.dokumen)}</td>
        <td>${b.file ? esc(b.file) : '<span class="muted">—</span>'}${b.catatan && b.status === 'Ditolak' ? `<br><small style="color:var(--bad)">${esc(b.catatan)}</small>` : ''}</td>
        <td>${Fmt.tanggal(b.tanggal)}</td>
        <td>${UI.badge(b.status)}</td>
        <td><div class="actions">${aksi(b)}</div></td>
      </tr>`).join('');
    Table.refresh('#tblBerkas');
    renderStats();
  }

  function aksi(b) {
    if (b.status === 'Menunggu') return `<button class="btn btn-ghost btn-sm" data-act="lihat">${icon('eye')}</button><button class="btn btn-ok btn-sm" data-act="ok">Setujui</button><button class="btn btn-ghost btn-sm" data-act="no">Tolak</button>`;
    if (b.status === 'Belum upload') return '<span class="muted text-sm">Menunggu siswa</span>';
    return `<button class="btn btn-ghost btn-sm" data-act="lihat">${icon('eye')}</button><button class="btn btn-ghost btn-sm" data-act="ulang">Tinjau ulang</button>`;
  }

  /* bila semua 6 dokumen siswa disetujui, tahap keberangkatan naik */
  function cekKelengkapan(idSiswa) {
    const dok = berkas.filter((b) => b.siswa === idSiswa);
    const s = siswa.find((x) => x.id === idSiswa);
    if (s && dok.length && dok.every((b) => b.status === 'Disetujui') && s.tahap < 3) {
      s.tahap = 3;
      Store.set('siswa', siswa);
      UI.toast(`Berkas ${s.nama} lengkap — tahap naik ke "${TAHAP[3]}".`);
    }
  }

  $('#tblBerkas').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const b = berkas.find((x) => x.id === btn.closest('tr').dataset.id);
    switch (btn.dataset.act) {
      case 'lihat': UI.toast(`Membuka ${b.file} (pratinjau simulasi).`, 'info'); break;
      case 'ok':
        b.status = 'Disetujui'; b.catatan = '';
        Store.set('berkas', berkas); render();
        UI.toast(`${b.dokumen} ${namaSiswa(b.siswa)} disetujui.`);
        cekKelengkapan(b.siswa); break;
      case 'no':
        sedangDitolak = b;
        $('#tolakInfo').textContent = `${b.dokumen} — ${namaSiswa(b.siswa)}`;
        Form.reset($('#formTolak'));
        Modal.open('#modalTolak'); break;
      case 'ulang':
        b.status = 'Menunggu'; Store.set('berkas', berkas); render(); break;
    }
  });

  $('#formTolak').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(e.target)) return;
    sedangDitolak.status = 'Ditolak';
    sedangDitolak.catatan = Form.data(e.target).catatan.trim();
    Store.set('berkas', berkas);
    Modal.close($('#modalTolak')); render();
    UI.toast('Dokumen ditolak. Siswa akan melihat alasannya.', 'bad');
  });

  render();
})();
