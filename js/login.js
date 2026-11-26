/* =====================================================
   login.js — Login simulasi berdasarkan peran
   Hak akses: setelah login, pengguna hanya bisa membuka
   folder sesuai perannya (dijaga oleh guard.js).
   ===================================================== */
(function () {
  const form = $('#formLogin');
  const params = new URLSearchParams(location.search);
  let role = 'admin';

  // Pesan dari penjaga akses
  const sesi = Auth.current();
  const notice = $('#notice');
  if (params.has('denied')) {
    notice.innerHTML = `<div class="alert alert-bad">${icon('x')}<span><b>Akses ditolak.</b> Peranmu tidak punya hak untuk membuka halaman itu.</span></div>`;
  } else if (params.has('need')) {
    notice.innerHTML = `<div class="alert alert-warn">${icon('clock')}<span>Silakan masuk terlebih dahulu.</span></div>`;
  }
  if (sesi) {
    const akun = Store.get('users')[sesi.role];
    notice.innerHTML += `<div class="alert alert-info">${icon('user')}<span>Kamu masih masuk sebagai <b>${esc(akun.nama)}</b> (${ROLE_LABEL[sesi.role]}). <a href="${sesi.role}/dashboard.html" style="text-decoration:underline;font-weight:600">Lanjut ke dashboard</a> atau <a href="#" id="keluar" style="text-decoration:underline;font-weight:600">keluar</a>.</span></div>`;
    const k = $('#keluar');
    if (k) k.addEventListener('click', (e) => { e.preventDefault(); Auth.logout(); location.href = 'login.html'; });
  }

  // Ganti peran
  function pilihPeran(r) {
    role = r;
    $$('.role-tab').forEach((t) => t.classList.toggle('active', t.dataset.role === r));
    $('#btnMasuk').textContent = 'Masuk sebagai ' + ROLE_LABEL[r];
    const akun = DB.users[r];
    $('#demoInfo').innerHTML = `<code>${akun.email}</code> / <code>${akun.password}</code>`;
    const warna = { admin: '#DC1F28', sensei: '#2563EB', siswa: '#0D9488', pimpinan: '#D97706' }[r];
    $('#btnMasuk').style.background = warna;
    Form.reset(form);
  }
  $$('.role-tab').forEach((t) => t.addEventListener('click', () => pilihPeran(t.dataset.role)));

  // Isi otomatis akun demo
  $('#isiDemo').addEventListener('click', () => {
    $('#email').value = DB.users[role].email;
    $('#password').value = DB.users[role].password;
    $('#password').focus();
  });

  // Tampilkan / sembunyikan sandi
  $('#lihat').addEventListener('click', () => {
    const p = $('#password');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Form.validate(form)) return;
    const d = Form.data(form);
    const hasil = Auth.login(role, d.email, d.password);
    if (!hasil) {
      Form.setError($('#password').closest('.field'), 'Email atau kata sandi salah untuk peran ' + ROLE_LABEL[role] + '.');
      return;
    }
    UI.toast('Login berhasil, mengalihkan…');
    setTimeout(() => { location.href = role + '/dashboard.html'; }, 500);
  });

  pilihPeran('admin');
  UI.hydrateIcons();
})();
