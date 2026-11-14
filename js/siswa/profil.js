/* siswa/profil.js — ubah data diri & kata sandi */
(function () {
  const user = Auth.user();
  let siswa = Store.get('siswa');
  const me = siswa.find((s) => s.id === user.id);
  const kelas = Store.get('kelas').find((k) => k.id === me.kelas);

  function tampil() {
    $('#avatar').textContent = Fmt.inisial(me.nama);
    $('#namaTampil').textContent = me.nama;
    $('#infoTampil').textContent = `${me.id} · Kelas ${me.kelas}`;
  }

  const form = $('#formProfil');
  Form.fill(form, me);
  $('#id').value = me.id;
  $('#kelas').value = kelas ? `${kelas.id} — ${kelas.nama}` : me.kelas;
  tampil();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    ['nama', 'telepon', 'email', 'kota', 'lahir'].forEach((k) => { me[k] = d[k].trim(); });
    Store.set('siswa', siswa);

    // nama & email juga dipakai akun login
    const users = Store.get('users');
    users.siswa.nama = me.nama; users.siswa.email = me.email;
    Store.set('users', users);

    tampil();
    UI.toast('Profil berhasil diperbarui.');
  });

  const sandi = $('#formSandi');
  sandi.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Form.data(sandi);
    const users = Store.get('users');
    sandi.elements.ulang.setCustomValidity(d.ulang !== d.baru ? 'Konfirmasi tidak sama dengan kata sandi baru.' : '');
    sandi.elements.lama.setCustomValidity(d.lama && d.lama !== users.siswa.password ? 'Kata sandi lama salah.' : '');
    if (!Form.validate(sandi)) return;
    users.siswa.password = d.baru;
    Store.set('users', users);
    Form.reset(sandi);
    UI.toast('Kata sandi berhasil diubah.');
  });
  sandi.addEventListener('input', (e) => e.target.setCustomValidity && e.target.setCustomValidity(''));
})();
