/* pimpinan/persetujuan.js — Otorisasi dan disposisi resmi Direktur LPK */
(function () {
  let persetujuan = Store.get('persetujuan') || [];
  const siswa = Store.get('siswa') || [];

  function namaSiswa(id) {
    if (!id || id === '-') return '-';
    const s = siswa.find((x) => x.id === id);
    return s ? `${s.nama} (${s.id})` : id;
  }

  function renderStats() {
    const menunggu = persetujuan.filter((p) => p.status === 'Menunggu').length;
    const disetujui = persetujuan.filter((p) => p.status === 'Disetujui').length;
    const ditolak = persetujuan.filter((p) => p.status === 'Ditolak').length;

    $('#statsApproval').innerHTML = [
      UI.stat('Menunggu Disposisi', menunggu, 'clock', 'amber', 'Perlu tindakan direktur'),
      UI.stat('Telah Disetujui', disetujui, 'check', 'green', 'Otorisasi selesai'),
      UI.stat('Ditolak / Ditolak Revisi', ditolak, 'x', 'bad', 'Perlu perbaikan oleh admin')
    ].join('');
  }

  function render() {
    renderStats();
    $('#tblApproval tbody').innerHTML = persetujuan.map((p) => `
      <tr data-id="${p.id}">
        <td><strong>${p.id}</strong><br><small class="muted">${Fmt.tanggal(p.tanggal)}</small></td>
        <td><b>${esc(p.jenis)}</b></td>
        <td>${esc(namaSiswa(p.siswa))}</td>
        <td>${esc(p.catatan)}<br><small class="muted">Diajukan oleh: ${esc(p.pemohon)}</small></td>
        <td>${UI.badge(p.status)}</td>
        <td>
          <div class="actions">
            ${p.status === 'Menunggu' ? `
              <button class="btn btn-sm btn-ok" data-act="setuju">${icon('check')} Setujui</button>
              <button class="btn btn-sm btn-ghost" data-act="tolak">Tolak</button>
            ` : `<span class="muted text-sm">Selesai diperiksa</span>`}
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="empty">Belum ada pengajuan disposisi.</td></tr>';
    Table.refresh('#tblApproval');
  }

  $('#tblApproval').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const p = persetujuan.find((x) => x.id === tr.dataset.id);
    if (!p) return;

    if (btn.dataset.act === 'setuju') {
      p.status = 'Disetujui';
      Store.set('persetujuan', persetujuan);
      AuditLog.record('sistem', 'Approval Direktur', `Direktur menyetujui ${p.id} (${p.jenis}) untuk ${namaSiswa(p.siswa)}.`, 'Sukses');
      render();
      UI.toast(`Pengajuan ${p.id} resmi disetujui oleh Direktur.`, 'ok');
    } else if (btn.dataset.act === 'tolak') {
      ask(`Tolak pengajuan ${p.id} (${p.jenis})? Permohonan akan dikembalikan ke pemohon untuk revisi.`, () => {
        p.status = 'Ditolak';
        Store.set('persetujuan', persetujuan);
        AuditLog.record('sistem', 'Penolakan Direktur', `Direktur menolak pengajuan ${p.id} (${p.jenis}) untuk perbaikan.`, 'Perhatian');
        render();
        UI.toast(`Pengajuan ${p.id} ditolak/dikembalikan ke pemohon.`, 'warn');
      }, 'Kembalikan Pengajuan');
    }
  });

  render();
})();
