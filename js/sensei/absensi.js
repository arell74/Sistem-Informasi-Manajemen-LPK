/* sensei/absensi.js — input absensi per kelas & tanggal */
(function () {
  const user = Auth.user();
  const kelas = Store.get('kelas').filter((k) => k.sensei === user.id);
  const siswaSemua = Store.get('siswa');
  const absensi = Store.get('absensi');
  const STATUS = ['Hadir', 'Izin', 'Sakit', 'Alpa'];

  const pilih = $('#pilihKelas'), tgl = $('#tanggal'), tbody = $('#tblAbsen tbody');
  pilih.innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);
  tgl.value = Fmt.isoHariIni();
  tgl.max = Fmt.isoHariIni();

  const kunci = () => `${pilih.value}|${tgl.value}`;
  const daftarSiswa = () => siswaSemua.filter((s) => s.kelas === pilih.value && s.status !== 'Cuti');

  function render() {
    const tersimpan = absensi[kunci()] || {};
    tbody.innerHTML = daftarSiswa().map((s, i) => `
      <tr data-id="${s.id}">
        <td>${i + 1}</td>
        <td><div class="cell-user">${UI.avatar(s.nama)}<div><strong>${esc(s.nama)}</strong><small>${s.id}</small></div></div></td>
        <td><div class="seg" role="radiogroup" aria-label="Kehadiran ${esc(s.nama)}">
          ${STATUS.map((st) => `<label><input type="radio" name="a_${s.id}" value="${st}" ${(tersimpan[s.id] || 'Hadir') === st ? 'checked' : ''}><span class="s-${st.toLowerCase()}">${st}</span></label>`).join('')}
        </div></td>
      </tr>`).join('') || '<tr><td colspan="3" class="muted" style="text-align:center;padding:2rem">Belum ada siswa aktif di kelas ini.</td></tr>';
    ringkas();
  }

  function ringkas() {
    const hitung = {};
    STATUS.forEach((s) => { hitung[s] = $$(`input[value="${s}"]:checked`, tbody).length; });
    const total = daftarSiswa().length;
    const sudah = absensi[kunci()] ? ' · <b>sudah tersimpan</b>' : '';
    $('#ringkas').innerHTML = STATUS.map((s) => `<span class="badge badge-${BADGE[s]}">${s}: ${hitung[s]}</span>`).join('')
      + `<span class="muted text-sm" style="align-self:center">Total ${total} siswa${sudah}</span>`;
  }

  tbody.addEventListener('change', ringkas);
  pilih.addEventListener('change', render);
  tgl.addEventListener('change', render);

  $('#semuaHadir').addEventListener('click', () => {
    $$('input[value="Hadir"]', tbody).forEach((r) => { r.checked = true; });
    ringkas();
  });

  $('#simpan').addEventListener('click', () => {
    if (!tgl.value) { UI.toast('Pilih tanggal pertemuan dulu.', 'bad'); return; }
    const hasil = {};
    $$('tr[data-id]', tbody).forEach((tr) => {
      const dipilih = $('input:checked', tr);
      if (dipilih) hasil[tr.dataset.id] = dipilih.value;
    });
    absensi[kunci()] = hasil;
    Store.set('absensi', absensi);
    ringkas();
    UI.toast(`Absensi ${pilih.value} tanggal ${Fmt.tanggal(tgl.value)} tersimpan.`);
  });

  if (!kelas.length) { $('#simpan').disabled = true; }
  render();
})();
