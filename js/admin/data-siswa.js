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
        AuditLog.record('siswa', 'Hapus Siswa', `Menghapus data siswa ${s.nama} (${s.id}) beserta seluruh berkas dan tagihannya.`, 'Perhatian');
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
      AuditLog.record('siswa', 'Ubah Data Siswa', `Memperbarui profil siswa ${d.nama} (${d.id}).`, 'Sukses');
      UI.toast('Data siswa diperbarui.');
    } else {
      d.id = Fmt.nextId('S', siswa);
      siswa.push(Object.assign(d, { progres: 0, tahap: 0 }));
      AuditLog.record('siswa', 'Tambah Siswa', `Menambahkan siswa baru ${d.nama} (${d.id}) di kelas ${d.kelas}.`, 'Sukses');
      UI.toast(`Siswa ${d.nama} ditambahkan (${d.id}).`);
    }
    Store.set('siswa', siswa);
    Modal.close(modal);
    render();
  });

  /* =====================================================
     IMPOR & EKSPOR EXCEL (pustaka SheetJS / XLSX)
     - Template : unduh file contoh + lembar petunjuk
     - Ekspor   : data yang sedang tampil (ikut filter/pencarian)
     - Impor    : baca .xlsx/.xls/.csv -> validasi tiap baris
                  -> pratinjau -> simpan baris yang valid
     ===================================================== */
  const MAKS_BARIS = 500, MAKS_UKURAN = 2 * 1024 * 1024;
  const STATUS_VALID = ['Aktif', 'Siap Berangkat', 'Cuti'];
  const WAJIB = { nama: 'Nama', telepon: 'Telepon', email: 'Email', kota: 'Kota Asal', lahir: 'Tanggal Lahir', kelas: 'Kelas', program: 'Program' };
  // nama kolom di Excel -> field (huruf besar/kecil, spasi, tanda baca diabaikan)
  const ALIAS = {
    nama: 'nama', namalengkap: 'nama', telepon: 'telepon', notelepon: 'telepon', nohp: 'telepon', hp: 'telepon',
    email: 'email', kota: 'kota', kotaasal: 'kota', tanggallahir: 'lahir', lahir: 'lahir', kelas: 'kelas',
    program: 'program', bidang: 'bidang', bidangkerja: 'bidang', status: 'status'
  };
  const normHead = (h) => String(h).toLowerCase().replace(/[^a-z]/g, '');
  const kunciSiswa = (nama, telp) => String(nama).trim().toLowerCase() + '|' + String(telp).replace(/\D/g, '');
  let hasilImpor = [];

  function adaXLSX() {
    if (typeof XLSX === 'undefined') {
      UI.toast('Pustaka Excel belum termuat. Periksa koneksi internet lalu muat ulang halaman.', 'bad');
      return false;
    }
    return true;
  }

  /* ----- Template ----- */
  function unduhTemplate() {
    if (!adaXLSX()) return;
    const kepala = ['Nama', 'Telepon', 'Email', 'Kota Asal', 'Tanggal Lahir', 'Kelas', 'Program', 'Bidang Kerja', 'Status'];
    const contoh = [
      ['Contoh Satu', '081234567890', 'contoh1@mail.com', 'Kuningan', '2002-05-17', kelas[0].id, DB.program[0].kode, BIDANG[0], 'Aktif'],
      ['Contoh Dua', '081298765432', 'contoh2@mail.com', 'Cirebon', '2001-11-03', kelas[0].id, DB.program[1].kode, '', 'Aktif']
    ];
    const wsData = XLSX.utils.aoa_to_sheet([kepala].concat(contoh));
    wsData['!cols'] = [24, 16, 26, 16, 14, 10, 10, 34, 16].map((w) => ({ wch: w }));

    const n = Math.max(kelas.length, DB.program.length, BIDANG.length, STATUS_VALID.length);
    const petunjuk = [['Kelas', 'Program (isi kode atau nama)', 'Bidang Kerja (opsional)', 'Status (opsional)']];
    for (let i = 0; i < n; i++) {
      petunjuk.push([
        kelas[i] ? kelas[i].id + ' = ' + kelas[i].nama : '',
        DB.program[i] ? DB.program[i].kode + ' = ' + DB.program[i].nama : '',
        BIDANG[i] || '', STATUS_VALID[i] || ''
      ]);
    }
    petunjuk.push([], ['Kolom wajib: Nama, Telepon, Email, Kota Asal, Tanggal Lahir, Kelas, Program.'],
      ['Tanggal Lahir: YYYY-MM-DD atau DD/MM/YYYY. Status kosong = Aktif. Hapus 2 baris contoh sebelum mengisi.']);
    const wsInfo = XLSX.utils.aoa_to_sheet(petunjuk);
    wsInfo['!cols'] = [34, 46, 36, 20].map((w) => ({ wch: w }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Siswa');
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Petunjuk');
    XLSX.writeFile(wb, 'template-impor-siswa.xlsx');
    UI.toast('Template diunduh. Isi lembar "Data Siswa", lalu impor.');
  }

  /* ----- Ekspor (hanya baris yang sedang tampil) ----- */
  function ekspor() {
    if (!adaXLSX()) return;
    const tampil = $$('#tblSiswa tbody tr[data-id]:not([hidden])').map((tr) => tr.dataset.id);
    const data = siswa.filter((s) => tampil.includes(s.id));
    if (!data.length) { UI.toast('Tidak ada data untuk diekspor.', 'bad'); return; }
    const baris = data.map((s) => ({
      'ID': s.id, 'Nama': s.nama, 'Telepon': s.telepon, 'Email': s.email, 'Kota Asal': s.kota,
      'Tanggal Lahir': s.lahir, 'Kelas': s.kelas, 'Program': namaProgram(s.program),
      'Bidang Kerja': s.bidang || '', 'Status': s.status, 'Progres (%)': s.progres
    }));
    const ws = XLSX.utils.json_to_sheet(baris);
    ws['!cols'] = [9, 24, 16, 26, 16, 14, 10, 36, 34, 16, 12].map((w) => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, `data-siswa-${Fmt.isoHariIni()}.xlsx`);
    UI.toast(`${data.length} data siswa diekspor ke Excel.`);
  }

  /* ----- Impor: konversi tanggal (serial Excel / YYYY-MM-DD / DD/MM/YYYY) ----- */
  function tanggalISO(v) {
    if (v === '' || v == null) return null;
    if (typeof v === 'number') {
      if (v < 1 || v > 80000) return null;
      return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
    }
    const t = String(v).trim();
    let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt.toISOString().slice(0, 10);
  }

  /* ----- Impor: validasi satu baris ----- */
  function cekBaris(r, no, sudahAda) {
    const salah = [];
    const nama = String(r.nama ?? '').trim();
    if (nama.length < 3) salah.push('Nama minimal 3 karakter');

    let telp = String(r.telepon ?? '').trim();
    if (/^8\d{8,11}$/.test(telp)) telp = '0' + telp; // Excel sering menghapus angka 0 di depan
    if (!/^[0-9+\- ]{9,16}$/.test(telp)) salah.push('Telepon tidak valid');

    const email = String(r.email ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) salah.push('Email tidak valid');

    const kota = String(r.kota ?? '').trim();
    if (!kota) salah.push('Kota asal kosong');

    const lahir = tanggalISO(r.lahir);
    if (!lahir) salah.push('Tanggal lahir tidak valid (pakai YYYY-MM-DD)');
    else if (lahir > Fmt.isoHariIni()) salah.push('Tanggal lahir di masa depan');

    const k = kelas.find((x) => x.id.toLowerCase() === String(r.kelas ?? '').trim().toLowerCase());
    if (!k) salah.push('Kelas tidak dikenal');

    const tp = String(r.program ?? '').trim().toLowerCase();
    const p = DB.program.find((x) => x.kode.toLowerCase() === tp || x.nama.toLowerCase() === tp);
    if (!p) salah.push('Program tidak dikenal');

    const tb = String(r.bidang ?? '').trim();
    const b = tb ? BIDANG.find((x) => x.toLowerCase() === tb.toLowerCase()) : '';
    if (tb && !b) salah.push('Bidang kerja tidak dikenal');

    const ts = String(r.status ?? '').trim();
    const st = ts ? STATUS_VALID.find((x) => x.toLowerCase() === ts.toLowerCase()) : 'Aktif';
    if (!st) salah.push('Status harus Aktif / Siap Berangkat / Cuti');

    // duplikat = nama + telepon yang sama dengan data lama atau baris sebelumnya
    let dobel = false;
    if (!salah.length) {
      const kunci = kunciSiswa(nama, telp);
      dobel = sudahAda.has(kunci);
      sudahAda.add(kunci);
    }
    return {
      no, salah, dobel,
      data: { nama, telepon: telp, email, kota, lahir: lahir || '', kelas: k ? k.id : '', program: p ? p.kode : '', bidang: b || '', status: st || '' }
    };
  }

  /* ----- Impor: baca file ----- */
  async function bacaFile(file) {
    if (!adaXLSX()) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { UI.toast('Format file harus .xlsx, .xls, atau .csv.', 'bad'); return; }
    if (file.size > MAKS_UKURAN) { UI.toast('Ukuran file maksimal 2 MB.', 'bad'); return; }

    let mentah;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      mentah = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    } catch (err) {
      UI.toast('File tidak dapat dibaca. Pastikan itu file Excel yang valid.', 'bad'); return;
    }
    if (!mentah.length) { UI.toast('File kosong. Gunakan template yang disediakan.', 'bad'); return; }
    if (mentah.length > MAKS_BARIS) { UI.toast(`Maksimal ${MAKS_BARIS} baris per impor.`, 'bad'); return; }

    // petakan nama kolom -> field
    const peta = {};
    Object.keys(mentah[0]).forEach((h) => { const f = ALIAS[normHead(h)]; if (f) peta[h] = f; });
    const hilang = Object.keys(WAJIB).filter((f) => !Object.values(peta).includes(f)).map((f) => WAJIB[f]);
    if (hilang.length) { UI.toast('Kolom wajib tidak ditemukan: ' + hilang.join(', ') + '. Gunakan template.', 'bad'); return; }

    const sudahAda = new Set(siswa.map((s) => kunciSiswa(s.nama, s.telepon)));
    hasilImpor = [];
    mentah.forEach((baris, i) => {
      const r = {};
      Object.keys(peta).forEach((h) => { r[peta[h]] = baris[h]; });
      if (!Object.values(r).some((v) => String(v).trim() !== '')) return; // lewati baris kosong
      hasilImpor.push(cekBaris(r, i + 2, sudahAda)); // baris 1 = judul kolom
    });
    if (!hasilImpor.length) { UI.toast('Tidak ada baris data di file.', 'bad'); return; }
    tampilPratinjau();
  }

  /* ----- Impor: pratinjau & konfirmasi ----- */
  function tampilPratinjau() {
    const ok = hasilImpor.filter((h) => !h.salah.length && !h.dobel);
    const salah = hasilImpor.filter((h) => h.salah.length);
    const dobel = hasilImpor.filter((h) => !h.salah.length && h.dobel);
    $('#ringkasImpor').innerHTML =
      `<span class="badge badge-ok">Valid: ${ok.length}</span>` +
      `<span class="badge badge-bad">Bermasalah: ${salah.length}</span>` +
      `<span class="badge badge-warn">Duplikat: ${dobel.length}</span>` +
      `<span class="muted text-sm" style="align-self:center">Total ${hasilImpor.length} baris</span>`;
    $('#tblImpor tbody').innerHTML = hasilImpor.map((h) => `
      <tr class="${h.salah.length ? 'baris-salah' : h.dobel ? 'baris-dobel' : ''}">
        <td>${h.no}</td>
        <td><strong>${esc(h.data.nama)}</strong></td>
        <td>${esc(h.data.kelas)}</td>
        <td>${esc(namaProgram(h.data.program))}</td>
        <td>${esc(h.data.status)}</td>
        <td>${h.salah.length
          ? `<span class="badge badge-bad">Ditolak</span><div class="ket">${esc(h.salah.join('; '))}</div>`
          : h.dobel
            ? '<span class="badge badge-warn">Duplikat</span><div class="ket">Nama & telepon sudah ada, dilewati</div>'
            : '<span class="badge badge-ok">Valid</span>'}</td>
      </tr>`).join('');
    const btn = $('#btnKonfirmasiImpor');
    btn.textContent = ok.length ? `Impor ${ok.length} data valid` : 'Tidak ada data valid';
    btn.disabled = !ok.length;
    Modal.open('#modalImpor');
  }

  $('#btnKonfirmasiImpor').addEventListener('click', () => {
    const ok = hasilImpor.filter((h) => !h.salah.length && !h.dobel);
    ok.forEach((h) => {
      siswa.push(Object.assign({ id: Fmt.nextId('S', siswa) }, h.data, { progres: 0, tahap: 0 }));
    });
    Store.set('siswa', siswa);
    hasilImpor = [];
    Modal.close($('#modalImpor'));
    render();
    UI.toast(`${ok.length} siswa berhasil diimpor.`);
  });

  $('#btnTemplate').addEventListener('click', unduhTemplate);
  $('#btnEkspor').addEventListener('click', ekspor);
  $('#btnImpor').addEventListener('click', () => $('#fileImpor').click());
  $('#fileImpor').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = ''; // supaya file yang sama bisa dipilih ulang
    if (f) bacaFile(f);
  });

  render();
})();
