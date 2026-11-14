/* sensei/input-nilai.js — input nilai dengan hitung rata-rata & predikat otomatis */
(function () {
  const user = Auth.user();
  const kelas = Store.get('kelas').filter((k) => k.sensei === user.id);
  const siswa = Store.get('siswa');
  const nilai = Store.get('nilai');
  const KOMPONEN = ['kosakata', 'kanji', 'tata', 'listening', 'kaiwa'];

  const pilih = $('#pilihKelas'), tbody = $('#tblNilai tbody');
  pilih.innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);

  const predikat = (r) => r >= 85 ? ['A', 'ok'] : r >= 75 ? ['B', 'info'] : r >= 65 ? ['C', 'warn'] : ['D', 'bad'];

  function render() {
    tbody.innerHTML = siswa.filter((s) => s.kelas === pilih.value).map((s) => {
      const n = nilai[s.id] || {};
      return `<tr data-id="${s.id}">
        <td><div class="cell-user">${UI.avatar(s.nama)}<div><strong>${esc(s.nama)}</strong><small>${s.id}</small></div></div></td>
        ${KOMPONEN.map((k) => `<td><input class="score" type="number" min="0" max="100" step="1" name="${k}" value="${n[k] ?? ''}" aria-label="${k} ${esc(s.nama)}"></td>`).join('')}
        <td data-rata><b>-</b></td><td data-pred></td></tr>`;
    }).join('') || '<tr><td colspan="8" class="muted" style="text-align:center;padding:2rem">Belum ada siswa di kelas ini.</td></tr>';
    $$('tr[data-id]', tbody).forEach(hitung);
    Table.refresh('#tblNilai');
  }

  function hitung(tr) {
    const v = $$('.score', tr).map((i) => Number(i.value) || 0);
    const rata = Math.round(v.reduce((a, b) => a + b, 0) / v.length);
    const [huruf, tone] = predikat(rata);
    $('[data-rata]', tr).innerHTML = `<b>${rata}</b>`;
    $('[data-pred]', tr).innerHTML = `<span class="badge badge-${tone}">${huruf}</span>`;
  }

  tbody.addEventListener('input', (e) => {
    const inp = e.target.closest('.score'); if (!inp) return;
    const v = Number(inp.value);
    inp.classList.toggle('bad', inp.value !== '' && (v < 0 || v > 100));
    hitung(inp.closest('tr'));
  });

  $('#simpan').addEventListener('click', () => {
    if ($('.score.bad', tbody)) { UI.toast('Ada nilai di luar rentang 0–100. Perbaiki dulu.', 'bad'); return; }
    $$('tr[data-id]', tbody).forEach((tr) => {
      const n = {};
      $$('.score', tr).forEach((i) => { n[i.name] = Number(i.value) || 0; });
      nilai[tr.dataset.id] = n;
    });
    Store.set('nilai', nilai);
    UI.toast('Nilai kelas ' + pilih.value + ' berhasil disimpan.');
  });

  pilih.addEventListener('change', render);
  if (!kelas.length) $('#simpan').disabled = true;
  render();
})();
