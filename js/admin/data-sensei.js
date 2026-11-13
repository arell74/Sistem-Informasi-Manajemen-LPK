/* admin/data-sensei.js — kelola data sensei */
(function () {
  let sensei = Store.get('sensei');
  const kelas = Store.get('kelas');
  const grid = $('#senseiGrid'), form = $('#formSensei'), modal = $('#modalSensei');

  function render() {
    grid.innerHTML = sensei.map((t) => {
      const ampu = kelas.filter((k) => k.sensei === t.id);
      return `
      <article class="card person" data-id="${t.id}">
        ${UI.avatar(t.nama, 'lg')}
        <h4>${esc(t.nama)}</h4>
        <div>${UI.badge(t.status)}</div>
        <dl>
          <div><dt>Spesialisasi</dt><dd>${esc(t.spesialisasi)}</dd></div>
          <div><dt>Asal</dt><dd>${esc(t.asal)}</dd></div>
          <div><dt>Kelas diampu</dt><dd>${ampu.length ? ampu.map((k) => k.id).join(', ') : '-'}</dd></div>
          <div><dt>Kontak</dt><dd>${esc(t.telepon)}</dd></div>
        </dl>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" data-edit>${icon('edit')} Ubah</button>
          <button class="btn btn-ghost btn-sm" data-del>${icon('trash')} Hapus</button>
        </div>
      </article>`;
    }).join('') || '<div class="empty card">Belum ada data sensei.</div>';
  }

  $('#btnTambah').addEventListener('click', () => {
    Form.reset(form); form.elements.id.value = '';
    $('#judulModal').textContent = 'Tambah Sensei';
    Modal.open('#modalSensei');
  });

  grid.addEventListener('click', (e) => {
    const kartu = e.target.closest('[data-id]'); if (!kartu) return;
    const t = sensei.find((x) => x.id === kartu.dataset.id);
    if (e.target.closest('[data-edit]')) {
      Form.reset(form); Form.fill(form, t);
      $('#judulModal').textContent = 'Ubah Data ' + t.id;
      Modal.open('#modalSensei');
    } else if (e.target.closest('[data-del]')) {
      const ampu = kelas.filter((k) => k.sensei === t.id);
      if (ampu.length) { UI.toast(`${t.nama} masih mengampu ${ampu.length} kelas. Pindahkan kelasnya dulu.`, 'bad'); return; }
      ask(`Hapus data sensei ${t.nama}?`, () => {
        sensei = sensei.filter((x) => x.id !== t.id);
        Store.set('sensei', sensei); render(); UI.toast('Data sensei dihapus.', 'bad');
      }, 'Hapus');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    if (d.id) { Object.assign(sensei.find((x) => x.id === d.id), d); UI.toast('Data sensei diperbarui.'); }
    else { d.id = Fmt.nextId('T', sensei); sensei.push(d); UI.toast(`Sensei ${d.nama} ditambahkan.`); }
    Store.set('sensei', sensei);
    Modal.close(modal); render();
  });

  render();
})();
