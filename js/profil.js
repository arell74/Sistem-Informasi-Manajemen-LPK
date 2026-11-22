/* profil.js — lihat profil, ubah data diri, dan ganti kata sandi (dipakai Admin, Sensei, Siswa) */
(function () {
  const role = document.documentElement.dataset.role;
  const user = Auth.user();
  const users = Store.get('users');
  const namaProgram = (kode) => (DB.program.find((p) => p.kode === kode) || {}).nama || kode;

  /* Sumber data tiap peran: admin = data akun, sensei & siswa = baris di datanya sendiri */
  let daftar = null, rec = null;
  if (role === 'sensei') { daftar = Store.get('sensei'); rec = daftar.find((t) => t.id === user.id); }
  if (role === 'siswa') { daftar = Store.get('siswa'); rec = daftar.find((s) => s.id === user.id); }
  const sumber = rec || users[role];
  const simpanData = () => (daftar && rec ? Store.set(role === 'sensei' ? 'sensei' : 'siswa', daftar) : Store.set('users', users));

  const kosong = '<span class="muted">—</span>';
  const isi = (v) => (v ? esc(v) : kosong);
  const INFO = {
    admin: (m) => [['ID', m.id], ['Jabatan', user.jabatan], ['Email', m.email], ['Telepon', m.telepon]],
    sensei: (m) => [['ID', m.id], ['Jabatan', user.jabatan], ['Asal', m.asal], ['Spesialisasi', m.spesialisasi], ['Email', m.email], ['Telepon', m.telepon], ['Status', m.status]],
    siswa: (m) => {
      const kelas = Store.get('kelas').find((k) => k.id === m.kelas);
      return [['ID', m.id], ['Kelas', kelas ? `${kelas.id} — ${kelas.nama}` : m.kelas], ['Program', namaProgram(m.program)], ['Bidang kerja', m.bidang],
        ['Email', m.email], ['Telepon', m.telepon], ['Kota asal', m.kota], ['Tanggal lahir', m.lahir ? Fmt.tanggal(m.lahir) : ''], ['Status', m.status]];
    }
  };

  const form = $('#formProfil'), lihat = $('#infoProfil'), btnEdit = $('#btnEdit');

  function tampil() {
    const m = sumber;
    $('#avatar').textContent = Fmt.inisial(m.nama);
    $('#namaTampil').textContent = m.nama;
    $('#infoTampil').textContent = `${m.id} · ${user.jabatan}`;
    $('#infoProfil').innerHTML = INFO[role](m).map(([k, v]) => `<dt>${k}</dt><dd>${isi(v)}</dd>`).join('');
    // topbar ikut berubah
    const av = $('.user-btn .avatar'), nama = $('.user-btn .who strong');
    if (av) av.textContent = Fmt.inisial(m.nama);
    if (nama) nama.textContent = m.nama;
  }

  function mode(edit) {
    form.hidden = !edit; lihat.hidden = edit; btnEdit.hidden = edit;
    if (edit) {
      Form.fill(form, sumber);
      const f = form.elements.nama;
      if (f) f.focus();
    }
  }

  btnEdit.addEventListener('click', () => mode(true));
  $('#btnBatal').addEventListener('click', () => { Form.reset(form); mode(false); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    Array.from(form.elements).filter((el) => el.name).forEach((el) => { sumber[el.name] = String(d[el.name] || '').trim(); });
    simpanData();
    // nama & email juga dipakai akun login
    users[role].nama = sumber.nama; users[role].email = sumber.email;
    Store.set('users', users);
    tampil(); mode(false);
    UI.toast('Profil berhasil diperbarui.');
  });

  const sandi = $('#formSandi');
  sandi.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Form.data(sandi);
    sandi.elements.ulang.setCustomValidity(d.ulang !== d.baru ? 'Konfirmasi tidak sama dengan kata sandi baru.' : '');
    sandi.elements.lama.setCustomValidity(d.lama && d.lama !== users[role].password ? 'Kata sandi lama salah.' : '');
    if (!Form.validate(sandi)) return;
    users[role].password = d.baru;
    Store.set('users', users);
    Form.reset(sandi);
    UI.toast('Kata sandi berhasil diubah.');
  });
  sandi.addEventListener('input', (e) => e.target.setCustomValidity && e.target.setCustomValidity(''));

  tampil();
})();
