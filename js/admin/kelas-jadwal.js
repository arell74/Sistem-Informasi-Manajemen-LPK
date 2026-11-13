/* admin/kelas-jadwal.js — kelola kelas & jadwal mingguan (dengan deteksi bentrok) */
(function () {
  let kelas = Store.get('kelas');
  let jadwal = Store.get('jadwal');
  const sensei = Store.get('sensei');
  const siswa = Store.get('siswa');
  const namaSensei = (id) => (sensei.find((t) => t.id === id) || {}).nama || id;

  /* "08.00–10.00" -> [480, 600] */
  const rentang = (jam) => jam.split('–').map((x) => { const [h, m] = x.split('.').map(Number); return h * 60 + m; });
  const terisi = (k) => k.jenis === 'utama' ? siswa.filter((s) => s.kelas === k.id).length : siswa.filter((s) => s.status !== 'Cuti').length;

  /* ----- Daftar kelas ----- */
  function renderKelas() {
    $('#tblKelas tbody').innerHTML = kelas.map((k) => {
      const n = terisi(k), persen = Math.min(100, Math.round(n / k.kuota * 100));
      return `<tr data-id="${k.id}">
        <td>${k.id}</td>
        <td><strong>${esc(k.nama)}</strong><br><small class="muted">${k.jenis === 'utama' ? 'Kelas utama' : 'Kelas umum'}</small></td>
        <td>${esc(k.level)}</td>
        <td>${esc(namaSensei(k.sensei))}</td>
        <td>${esc(k.ruang)}</td>
        <td style="min-width:150px"><div class="progress-row"><div class="progress ${persen > 90 ? 'warn' : ''}"><i style="--v:${persen}%"></i></div><b>${n}/${k.kuota}</b></div></td>
        <td><div class="actions"><button class="btn btn-ghost btn-sm" data-del aria-label="Hapus kelas ${esc(k.nama)}">${icon('trash')}</button></div></td>
      </tr>`;
    }).join('');
  }

  $('#tblKelas').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]'); if (!btn) return;
    const k = kelas.find((x) => x.id === btn.closest('tr').dataset.id);
    if (k.jenis === 'utama' && siswa.some((s) => s.kelas === k.id)) { UI.toast('Kelas masih berisi siswa. Pindahkan siswanya dulu.', 'bad'); return; }
    ask(`Hapus kelas ${k.nama}? Jadwalnya juga akan dihapus.`, () => {
      kelas = kelas.filter((x) => x.id !== k.id);
      jadwal = jadwal.filter((j) => j.kelas !== k.id);
      Store.set('kelas', kelas); Store.set('jadwal', jadwal);
      renderKelas(); renderWeek(); isiPilihan(); UI.toast('Kelas dihapus.', 'bad');
    }, 'Hapus');
  });

  /* ----- Jadwal mingguan ----- */
  function renderWeek() {
    const hariIni = Fmt.hariIni();
    $('#week').innerHTML = HARI.map((h) => {
      const slot = jadwal.map((j, i) => Object.assign({ i }, j)).filter((j) => j.hari === h).sort((a, b) => rentang(a.jam)[0] - rentang(b.jam)[0]);
      return `<div class="week-day ${h === hariIni ? 'today' : ''}"><h4>${h}${h === hariIni ? '<span class="badge badge-ok">Hari ini</span>' : ''}</h4>
        ${slot.map((j) => `<div class="chip"><strong>${j.jam}</strong>${esc(j.mapel)}<small>${esc(j.kelas)} · ${esc(namaSensei(j.sensei))}</small><small>${esc(j.ruang)}</small>
          <button class="x" data-del-j="${j.i}" aria-label="Hapus jadwal">${icon('x')}</button></div>`).join('') || '<small class="muted">Tidak ada jadwal</small>'}</div>`;
    }).join('');
  }

  $('#week').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del-j]'); if (!btn) return;
    ask('Hapus jadwal ini?', () => {
      jadwal.splice(Number(btn.dataset.delJ), 1);
      Store.set('jadwal', jadwal); renderWeek(); UI.toast('Jadwal dihapus.', 'bad');
    }, 'Hapus');
  });

  /* ----- Form ----- */
  function isiPilihan() {
    $('#k_sensei').innerHTML = UI.options(sensei.filter((t) => t.status === 'Aktif'), 'id', (t) => t.nama);
    $('#j_hari').innerHTML = HARI.map((h) => `<option>${h}</option>`).join('');
    $('#j_kelas').innerHTML = UI.options(kelas, 'id', (k) => `${k.id} — ${k.nama}`);
  }

  $('#btnTambahKelas').addEventListener('click', () => { Form.reset($('#formKelas')); Modal.open('#modalKelas'); });
  $('#btnTambahJadwal').addEventListener('click', () => { Form.reset($('#formJadwal')); Modal.open('#modalJadwal'); });

  $('#formKelas').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (!Form.validate(f)) return;
    const d = Form.data(f);
    d.id = 'K-' + d.nama.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() + (kelas.length + 1);
    d.kuota = Number(d.kuota);
    kelas.push(d);
    Store.set('kelas', kelas);
    Modal.close($('#modalKelas')); renderKelas(); isiPilihan();
    UI.toast(`Kelas ${d.nama} ditambahkan.`);
  });

  $('#formJadwal').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, d = Form.data(f);
    // validasi jam
    f.elements.selesai.setCustomValidity(d.selesai <= d.mulai ? 'Jam selesai harus setelah jam mulai.' : '');
    if (!Form.validate(f)) return;

    const k = kelas.find((x) => x.id === d.kelas);
    const jam = d.mulai.replace(':', '.') + '–' + d.selesai.replace(':', '.');
    const [a1, b1] = rentang(jam);

    // deteksi bentrok: sensei atau ruang yang sama pada hari & jam beririsan
    const bentrok = jadwal.find((j) => {
      if (j.hari !== d.hari) return false;
      const [a2, b2] = rentang(j.jam);
      return a1 < b2 && a2 < b1 && (j.sensei === k.sensei || j.ruang === k.ruang);
    });
    if (bentrok) {
      const sebab = bentrok.sensei === k.sensei ? `Sensei ${namaSensei(k.sensei)}` : `${k.ruang}`;
      Form.setError(f.elements.mulai.closest('.field'), `Bentrok: ${sebab} sudah dipakai ${bentrok.hari} ${bentrok.jam} (${bentrok.kelas}).`);
      return;
    }
    jadwal.push({ hari: d.hari, jam, kelas: k.id, mapel: d.mapel.trim(), sensei: k.sensei, ruang: k.ruang });
    Store.set('jadwal', jadwal);
    Modal.close($('#modalJadwal')); renderWeek();
    UI.toast('Jadwal ditambahkan.');
  });
  // hapus pesan custom saat jam diubah
  $('#formJadwal').addEventListener('input', (e) => e.target.setCustomValidity && e.target.setCustomValidity(''));

  isiPilihan(); renderKelas(); renderWeek();
})();
