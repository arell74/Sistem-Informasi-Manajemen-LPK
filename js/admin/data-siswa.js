/* admin/data-siswa.js — CRUD data siswa (tambah, ubah, hapus, cari, filter) */
(function () {
  let siswa = Store.get('siswa');
  const kelas = Store.get('kelas').filter((k) => k.jenis === 'utama');
  const tbody = $('#tblSiswa tbody'), form = $('#formSiswa'), modal = $('#modalSiswa');
  const namaProgram = (kode) => (DB.program.find((p) => p.kode === kode) || {}).nama || kode;

  $('#s_kelas').innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);
  $('#s_program').innerHTML = UI.options(DB.program, 'kode', 'nama');
  $('#s_bidang').innerHTML = '<option value="">—</option>' + BIDANG.map((b) => `<option>${b}</option>`).join('');
  $('#filterKelas').insertAdjacentHTML('beforeend', kelas.map((k) => `<option>${k.id}</option>`).join(''));

  function render() {
    tbody.innerHTML = siswa.map((s) => `
      <tr data-id="${s.id}">
        <td>${s.id}</td>
        <td><div class="cell-user">${UI.avatar(s.nama)}<div><strong>${esc(s.nama)}</strong><small>${esc(s.kota)} · ${esc(s.telepon)}</small></div></div></td>
        <td>${esc(s.kelas)}</td>
        <td>${esc(namaProgram(s.program))}${s.bidang ? `<br><small class="muted">${esc(s.bidang)}</small>` : ''}</td>
        <td><div class="progress-row"><div class="progress"><i style="--v:${s.progres}%"></i></div><b>${s.progres}%</b></div></td>
        <td>${UI.badge(s.status)}</td>
        <td><div class="actions">
          <button class="btn btn-ghost btn-sm" data-edit aria-label="Ubah ${esc(s.nama)}">${icon('edit')}</button>
          <button class="btn btn-ghost btn-sm" data-del aria-label="Hapus ${esc(s.nama)}">${icon('trash')}</button>
        </div></td>
      </tr>`).join('');
    Table.refresh('#tblSiswa');
    $('#info').textContent = `Total ${siswa.length} siswa terdaftar.`;
  }

  $('#btnTambah').addEventListener('click', () => {
    Form.reset(form);
    form.elements.id.value = '';
    $('#judulModal').textContent = 'Tambah Siswa';
    Modal.open('#modalSiswa');
  });

  tbody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]'); if (!tr) return;
    const s = siswa.find((x) => x.id === tr.dataset.id);
    if (e.target.closest('[data-edit]')) {
      Form.reset(form);
      Form.fill(form, s);
      $('#judulModal').textContent = 'Ubah Data ' + s.id;
      Modal.open('#modalSiswa');
    } else if (e.target.closest('[data-del]')) {
      ask(`Hapus ${s.nama} (${s.id})? Berkas dan tagihan siswa ini juga akan dihapus.`, () => {
        siswa = siswa.filter((x) => x.id !== s.id);
        Store.set('siswa', siswa);
        Store.set('berkas', Store.get('berkas').filter((b) => b.siswa !== s.id));
        Store.set('pembayaran', Store.get('pembayaran').filter((b) => b.siswa !== s.id));
        render();
        UI.toast('Data siswa dihapus.', 'bad');
      }, 'Hapus');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    d.nama = d.nama.trim();
    if (d.id) {
      Object.assign(siswa.find((x) => x.id === d.id), d);
      UI.toast('Data siswa diperbarui.');
    } else {
      d.id = Fmt.nextId('S', siswa);
      siswa.push(Object.assign(d, { progres: 0, tahap: 0 }));
      UI.toast(`Siswa ${d.nama} ditambahkan (${d.id}).`);
    }
    Store.set('siswa', siswa);
    Modal.close(modal);
    render();
  });

  render();
})();
