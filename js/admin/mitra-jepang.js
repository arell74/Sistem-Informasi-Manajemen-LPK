/* admin/mitra-jepang.js — Manajemen Perusahaan Penerima (Kaisha) & Asosiasi (Kumiai) Jepang */
(function () {
  let mitra = Store.get('mitra') || [];
  const siswa = Store.get('siswa') || [];

  const modal = $('#modalMitra');
  const form = $('#formMitra');

  function renderStats() {
    const totalMitra = mitra.length;
    const totalKuota = mitra.reduce((t, m) => t + Number(m.kuota || 0), 0);
    const totalTerisi = mitra.reduce((t, m) => t + Number(m.terisi || 0), 0);
    const prefList = new Set(mitra.map((m) => m.prefektur.split(' ')[0])).size;

    $('#statsMitra').innerHTML = [
      UI.stat('Mitra Perusahaan (Kaisha)', totalMitra, 'award', 'navy', 'Aktif bekerjasama'),
      UI.stat('Total Kuota Tersedia', totalKuota + ' Posisi', 'users', 'green', 'Kebutuhan tenaga kerja'),
      UI.stat('Siswa Terpenuhi', totalTerisi + ' Peserta', 'plane', 'accent', Math.round((totalTerisi / (totalKuota || 1)) * 100) + '% dari total kuota'),
      UI.stat('Wilayah / Prefektur', prefList + ' Prefektur', 'pin', 'amber', 'Jepang Kanto, Kansai, Chubu')
    ].join('');
  }

  function render() {
    renderStats();
    $('#tblMitraAdmin tbody').innerHTML = mitra.map((m) => `
      <tr data-id="${m.id}">
        <td><strong>${m.id}</strong></td>
        <td>
          <strong>${esc(m.nama)}</strong>
          ${m.kanji ? `<br><small style="color:#C8102E;font-family:'Noto Sans JP'">${esc(m.kanji)}</small>` : ''}
        </td>
        <td>
          <b>${esc(m.kumiai)}</b><br>
          <span class="badge badge-info">${esc(m.prefektur)}</span>
        </td>
        <td>${esc(m.bidang)}</td>
        <td>
          <b>¥${Number(m.gaji || 0).toLocaleString('ja-JP')}</b> / bln<br>
          <small class="muted">${esc(m.asrama || 'Asrama Tersedia')}</small>
        </td>
        <td class="num">
          <b>${m.terisi}</b> / ${m.kuota}
          <div class="progress ${m.terisi >= m.kuota ? 'ok' : ''}" style="height:5px;margin-top:.2rem">
            <i style="--v:${Math.min(100, Math.round((m.terisi / m.kuota) * 100))}%"></i>
          </div>
        </td>
        <td>${UI.badge(m.status)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-outline" data-siswa title="Lihat siswa yang ditempatkan">${icon('users')} Siswa</button>
            <button class="btn btn-sm btn-ghost" data-edit title="Ubah data">${icon('edit')}</button>
            <button class="btn btn-sm btn-ghost" data-del title="Hapus mitra">${icon('trash')}</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" class="empty">Belum ada data mitra perusahaan.</td></tr>';
    Table.refresh('#tblMitraAdmin');
  }

  $('#btnTambahMitra').addEventListener('click', () => {
    Form.reset(form);
    form.elements.id.value = '';
    $('#judulModalMitra').textContent = 'Tambah Mitra Perusahaan Jepang';
    Modal.open(modal);
  });

  $('#tblMitraAdmin').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const m = mitra.find((x) => x.id === tr.dataset.id);
    if (!m) return;

    if (e.target.closest('[data-edit]')) {
      Form.reset(form);
      Form.fill(form, m);
      $('#judulModalMitra').textContent = 'Ubah Mitra ' + m.id;
      Modal.open(modal);
    } else if (e.target.closest('[data-del]')) {
      ask(`Hapus kerjasama dengan ${m.nama} (${m.id})? Data penempatan siswa ke perusahaan ini akan terputus.`, () => {
        mitra = mitra.filter((x) => x.id !== m.id);
        Store.set('mitra', mitra);
        AuditLog.record('mitra', 'Hapus Mitra Kaisha', `Menghapus kerjasama perusahaan ${m.nama} (${m.id}).`, 'Perhatian');
        render();
        UI.toast('Data mitra perusahaan dihapus.', 'bad');
      }, 'Hapus Mitra');
    } else if (e.target.closest('[data-siswa]')) {
      const siswaTerpilih = siswa.filter((s) => s.mitra === m.id);
      $('#judulDetailMitra').textContent = `Peserta Magang di ${m.nama} (${m.prefektur})`;
      $('#bodySiswaMitra').innerHTML = siswaTerpilih.length ? `
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Tahap Imigrasi & CoE</th>
                <th>No. CoE</th>
                <th>Target Terbang</th>
              </tr>
            </thead>
            <tbody>
              ${siswaTerpilih.map((s) => `
                <tr>
                  <td><b>${s.id}</b></td>
                  <td><strong>${esc(s.nama)}</strong></td>
                  <td>${esc(s.kelas)}</td>
                  <td><span class="badge badge-info">${esc(s.tahap_imigrasi || '-')}</span></td>
                  <td><code>${esc(s.no_coe || '-')}</code></td>
                  <td><b>${esc(s.target_terbang || '-')}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty">Belum ada siswa yang ditempatkan di perusahaan ini.</div>';
      Modal.open('#modalSiswaMitra');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    d.nama = d.nama.trim();
    d.gaji = Number(d.gaji || 170000);
    d.kuota = Number(d.kuota || 5);

    if (d.id) {
      const existing = mitra.find((x) => x.id === d.id);
      Object.assign(existing, d);
      AuditLog.record('mitra', 'Ubah Mitra Kaisha', `Memperbarui data kemitraan ${d.nama} (${d.id}).`, 'Sukses');
      UI.toast('Data mitra berhasil diperbarui.');
    } else {
      d.id = Fmt.nextId('KAI', mitra);
      d.terisi = 0;
      mitra.push(d);
      AuditLog.record('mitra', 'Tambah Mitra Kaisha', `Menambahkan mitra perusahaan baru ${d.nama} (${d.id}) di ${d.prefektur}.`, 'Sukses');
      UI.toast(`Mitra baru ${d.nama} (${d.id}) ditambahkan.`);
    }

    Store.set('mitra', mitra);
    Modal.close(modal);
    render();
  });

  render();
})();
