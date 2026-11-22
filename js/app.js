/* =====================================================
   app.js — Fungsi inti Yuuki Portal
   1. Helper DOM & format
   2. Store  : penyimpanan data (localStorage, pengganti database)
   3. Auth   : login / logout / sesi
   4. UI     : toast, modal, konfirmasi, badge, kartu statistik
   5. Form   : validasi sederhana
   6. Table  : pencarian & filter tabel
   7. Shell  : sidebar + topbar dashboard (menu sesuai peran)
   ===================================================== */

/* ---------- 1. Helper ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const Fmt = {
  rupiah: (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID'),
  tanggal: (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
  tanggalPanjang: () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  hariIni: () => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()],
  isoHariIni: () => new Date().toLocaleDateString('sv-SE'),
  inisial: (nama) => String(nama).split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase(),
  nextId: (prefix, list, key = 'id') => {
    const max = list.reduce((m, x) => Math.max(m, parseInt(String(x[key]).split('-')[1], 10) || 0), 0);
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }
};

/* ---------- Ikon (SVG inline) ---------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  wallet: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  filecheck: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>',
  checksq: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  award: '<circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  grad: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'
};
const icon = (name, cls = '') =>
  `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------- 2. Store (pengganti database) ---------- */
const Store = {
  prefix: 'yuuki_db_',
  get(key) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage tidak tersedia -> pakai data bawaan */ }
    return JSON.parse(JSON.stringify(DB[key]));
  },
  set(key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch (e) {}
  },
  reset() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(this.prefix)).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
};

/* Sinkronisasi data.js: jika isi DB berubah (misalnya kamu mengedit nama siswa),
   salinan lama di localStorage dibuang supaya perubahan langsung terlihat setelah
   halaman dimuat ulang. Selama data.js tidak diubah, perubahan lewat website tetap tersimpan. */
(function sinkronDataDummy() {
  const json = JSON.stringify(DB);
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  try {
    if (localStorage.getItem('yuuki_dbhash') !== String(h)) {
      Store.reset();
      localStorage.setItem('yuuki_dbhash', String(h));
    }
  } catch (e) { /* localStorage tidak tersedia */ }
})();

/* ---------- 3. Auth ---------- */
const ROLE_LABEL = { admin: 'Admin LPK', sensei: 'Sensei', siswa: 'Siswa' };
const Auth = {
  key: 'yuuki_session',
  current() {
    try { return JSON.parse(localStorage.getItem(this.key)); } catch (e) { return null; }
  },
  login(role, email, password) {
    const akun = Store.get('users')[role];
    if (!akun || akun.email.toLowerCase() !== String(email).trim().toLowerCase() || akun.password !== password) return null;
    const sesi = { role, id: akun.id };
    try { localStorage.setItem(this.key, JSON.stringify(sesi)); } catch (e) {}
    return sesi;
  },
  logout() { try { localStorage.removeItem(this.key); } catch (e) {} },
  user() {
    const s = this.current();
    return s ? Object.assign({ role: s.role }, Store.get('users')[s.role]) : null;
  }
};

/* ---------- 4. UI ---------- */
const BADGE = {
  'Aktif': 'ok', 'Lunas': 'ok', 'Disetujui': 'ok', 'Hadir': 'ok', 'Diterima': 'ok',
  'Siap Berangkat': 'info', 'Izin': 'info',
  'Menunggu': 'warn', 'Baru': 'warn', 'Sakit': 'warn', 'Cuti': 'warn',
  'Ditolak': 'bad', 'Belum': 'bad', 'Alpa': 'bad', 'Nonaktif': 'bad',
  'Belum upload': 'muted'
};

const UI = {
  badge: (teks) => `<span class="badge badge-${BADGE[teks] || 'muted'}">${esc(teks)}</span>`,

  stat(label, nilai, ic, tone = 'accent', catatan = '') {
    return `<div class="card stat">
      <div class="stat-icon tone-${tone}">${icon(ic)}</div>
      <div><small>${esc(label)}</small><strong>${nilai}</strong>${catatan ? `<em>${catatan}</em>` : ''}</div>
    </div>`;
  },

  avatar: (nama, cls = '') => `<span class="avatar ${cls}">${esc(Fmt.inisial(nama))}</span>`,

  toast(pesan, tipe = 'ok') {
    let wadah = $('#toasts');
    if (!wadah) { wadah = document.createElement('div'); wadah.id = 'toasts'; document.body.appendChild(wadah); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + tipe;
    t.setAttribute('role', 'status');
    t.innerHTML = `${icon(tipe === 'ok' ? 'check' : tipe === 'bad' ? 'x' : 'clock')}<span>${esc(pesan)}</span>`;
    wadah.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  },

  hydrateIcons() {
    $$('[data-icon]').forEach((el) => {
      if (!el.dataset.done) { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); el.dataset.done = '1'; }
    });
  },

  /* download berkas contoh (simulasi) */
  download(namaFile, isi) {
    const blob = new Blob([isi], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = namaFile;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  options(items, nilai, label, pilih) {
    return items.map((x) => `<option value="${esc(x[nilai])}"${pilih !== undefined && pilih === x[nilai] ? ' selected' : ''}>${esc(typeof label === 'function' ? label(x) : x[label])}</option>`).join('');
  }
};

/* Modal */
const Modal = {
  open(sel) {
    const m = $(sel); if (!m) return;
    m.hidden = false;
    document.body.classList.add('modal-open');
    const f = $('input:not([type=hidden]),select,textarea', m);
    if (f) setTimeout(() => f.focus(), 40);
  },
  close(m) {
    if (!m) return;
    m.hidden = true;
    if (!$('.modal:not([hidden])')) document.body.classList.remove('modal-open');
  }
};

/* Kotak konfirmasi (pengganti confirm() bawaan browser) */
function ask(pesan, onYes, labelYa = 'Ya, lanjutkan', tone = 'danger') {
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-box sm" role="dialog" aria-modal="true">
      <div class="modal-body"><h3>Konfirmasi</h3><p class="muted">${esc(pesan)}</p></div>
      <div class="modal-foot"><button class="btn btn-ghost" data-no>Batal</button><button class="btn btn-${tone}" data-yes>${esc(labelYa)}</button></div>
    </div>`;
  document.body.appendChild(m);
  document.body.classList.add('modal-open');
  const tutup = () => { m.remove(); if (!$('.modal:not([hidden])')) document.body.classList.remove('modal-open'); };
  $('[data-yes]', m).addEventListener('click', () => { tutup(); onYes(); });
  $('[data-no]', m).addEventListener('click', tutup);
  m.addEventListener('click', (e) => { if (e.target === m) tutup(); });
  $('[data-yes]', m).focus();
}

/* ---------- 5. Form ---------- */
const Form = {
  data: (form) => Object.fromEntries(new FormData(form)),

  pesan(inp) {
    const v = inp.validity;
    if (v.valueMissing) return inp.type === 'checkbox' ? 'Centang kotak ini untuk melanjutkan.' : 'Wajib diisi.';
    if (v.typeMismatch) return 'Format tidak valid.';
    if (v.patternMismatch || v.rangeOverflow || v.rangeUnderflow || v.tooShort || v.tooLong) return inp.dataset.msg || 'Isian tidak sesuai.';
    return inp.validationMessage || 'Isian tidak valid.';
  },

  setError(field, teks) {
    let el = $('.error-msg', field);
    if (!el) { el = document.createElement('small'); el.className = 'error-msg'; field.appendChild(el); }
    el.textContent = teks || '';
    field.classList.toggle('invalid', !!teks);
  },

  /* mengembalikan true bila semua isian valid */
  validate(form) {
    let valid = true, pertama = null;
    $$('.field', form).forEach((field) => {
      const inp = $('input,select,textarea', field);
      if (!inp || inp.disabled) return;
      const ok = inp.checkValidity();
      this.setError(field, ok ? '' : this.pesan(inp));
      if (!ok) { valid = false; if (!pertama) pertama = inp; }
    });
    if (pertama) pertama.focus();
    return valid;
  },

  reset(form) { form.reset(); $$('.field', form).forEach((f) => this.setError(f, '')); },

  /* isi form dari objek { namaField: nilai } */
  fill(form, obj) {
    Object.entries(obj).forEach(([k, v]) => { const el = form.elements[k]; if (el) el.value = v; });
  }
};
document.addEventListener('input', (e) => {
  const field = e.target.closest('.field.invalid');
  if (field && e.target.checkValidity()) Form.setError(field, '');
});

/* ---------- 6. Tabel: cari & filter ---------- */
const Table = {
  refresh(sel) {
    const tabel = $(sel); if (!tabel) return;
    const cari = $(`[data-search="${sel}"]`);
    const q = (cari ? cari.value : '').toLowerCase().trim();
    const filter = $$(`[data-filter="${sel}"]`);
    let tampil = 0;
    $$('tbody tr:not(.empty-row)', tabel).forEach((tr) => {
      let cocok = !q || tr.textContent.toLowerCase().includes(q);
      filter.forEach((f) => {
        if (!f.value) return;
        const sel_ = tr.children[Number(f.dataset.col)];
        if (!sel_ || sel_.textContent.trim().toLowerCase() !== f.value.toLowerCase()) cocok = false;
      });
      tr.hidden = !cocok;
      if (cocok) tampil++;
    });
    let kosong = $('.empty-row', tabel);
    if (!kosong) {
      kosong = document.createElement('tr');
      kosong.className = 'empty-row';
      kosong.innerHTML = `<td colspan="${$$('thead th', tabel).length}">Tidak ada data yang cocok.</td>`;
      $('tbody', tabel).appendChild(kosong);
    }
    kosong.hidden = tampil > 0;
  }
};

/* ---------- Event global ---------- */
document.addEventListener('input', (e) => {
  const t = e.target.closest('[data-search],[data-filter]');
  if (t) Table.refresh(t.dataset.search || t.dataset.filter);
});

document.addEventListener('click', (e) => {
  // buka / tutup modal
  const buka = e.target.closest('[data-open]');
  if (buka) { e.preventDefault(); Modal.open(buka.dataset.open); return; }
  const tutup = e.target.closest('[data-close]');
  if (tutup) { Modal.close(tutup.closest('.modal')); return; }
  if (e.target.classList.contains('modal')) { Modal.close(e.target); return; }

  // tab
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    const grup = tab.closest('[data-tabs]');
    $$('[data-tab]', grup).forEach((b) => b.classList.toggle('active', b === tab));
    $$('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
    return;
  }

  // sidebar mobile & menu pengguna
  if (e.target.closest('.menu-toggle')) document.body.classList.toggle('nav-open');
  else if (e.target.closest('.backdrop')) document.body.classList.remove('nav-open');

  const wrap = $('.user-wrap');
  if (wrap) {
    if (e.target.closest('.user-btn')) wrap.classList.toggle('open');
    else if (!e.target.closest('.user-menu')) wrap.classList.remove('open');
  }

  if (e.target.closest('[data-logout]')) Auth.logout();

  if (e.target.closest('[data-reset-demo]')) {
    e.preventDefault();
    ask('Semua perubahan data demo akan dikembalikan ke kondisi awal. Lanjutkan?', () => { Store.reset(); location.reload(); }, 'Reset data', 'danger');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $$('.modal:not([hidden])').forEach(Modal.close);
    document.body.classList.remove('nav-open');
  }
});

/* ---------- 7. Shell dashboard ---------- */
const MENUS = {
  admin: [
    { href: 'dashboard',        label: 'Dashboard',         icon: 'dashboard' },
    { href: 'data-siswa',       label: 'Data Siswa',        icon: 'users' },
    { href: 'data-sensei',      label: 'Data Sensei',       icon: 'user' },
    { href: 'kelas-jadwal',     label: 'Kelas & Jadwal',    icon: 'calendar' },
    { href: 'pembayaran',       label: 'Pembayaran',        icon: 'wallet' },
    { href: 'verifikasi-berkas', label: 'Verifikasi Berkas', icon: 'filecheck' },
    { href: 'pengumuman',       label: 'Pengumuman',        icon: 'megaphone' }
  ],
  sensei: [
    { href: 'dashboard',  label: 'Dashboard',  icon: 'dashboard' },
    { href: 'kelas-saya', label: 'Kelas Saya', icon: 'book' },
    { href: 'absensi',    label: 'Absensi',    icon: 'checksq' },
    { href: 'input-nilai', label: 'Input Nilai', icon: 'edit' },
    { href: 'materi',     label: 'Materi',     icon: 'folder' }
  ],
  siswa: [
    { href: 'dashboard',  label: 'Dashboard',          icon: 'dashboard' },
    { href: 'jadwal',     label: 'Jadwal Belajar',     icon: 'calendar' },
    { href: 'materi',     label: 'Materi Belajar',     icon: 'folder' },
    { href: 'nilai',      label: 'Nilai & Progres',    icon: 'award' },
    { href: 'pembayaran', label: 'Pembayaran',         icon: 'wallet' },
    { href: 'berkas',     label: 'Berkas Keberangkatan', icon: 'filecheck' },
    { href: 'profil',     label: 'Profil Saya',        icon: 'user' }
  ]
};

(function renderShell() {
  const { role, page, title } = document.documentElement.dataset;
  const sidebar = $('#sidebar'), topbar = $('#topbar');
  if (!role || !sidebar || !topbar) return;

  const user = Auth.user();
  if (!user || user.role !== role) return; // guard.js sudah mengalihkan halaman

  sidebar.innerHTML = `
    <a class="brand" href="dashboard.html"><span class="brand-mark jp">勇気</span><span><strong>Yuuki</strong><small>${ROLE_LABEL[role]}</small></span></a>
    <nav class="nav" aria-label="Menu utama">
      ${MENUS[role].map((m) => `<a href="${m.href}.html" class="${m.href === page ? 'active' : ''}"${m.href === page ? ' aria-current="page"' : ''}>${icon(m.icon)}<span>${m.label}</span></a>`).join('')}
    </nav>
    <div class="sidebar-foot"><a href="../login.html" data-logout>${icon('logout')}<span>Keluar</span></a></div>`;

  topbar.innerHTML = `
    <button class="icon-btn menu-toggle" aria-label="Buka menu">${icon('menu')}</button>
    <div class="topbar-title"><h1>${esc(title || '')}</h1><p>${Fmt.tanggalPanjang()}</p></div>
    <div class="user-wrap">
      <button class="user-btn" aria-haspopup="true">
        <span class="avatar">${esc(Fmt.inisial(user.nama))}</span>
        <span class="who"><strong>${esc(user.nama)}</strong><small>${esc(user.jabatan)}</small></span>
      </button>
      <div class="user-menu">
        <a href="profil.html">${icon('user')} Profil Saya</a>
        <a href="../index.html">${icon('pin')} Ke website utama</a>
        <a href="#" data-reset-demo>${icon('clock')} Reset data demo</a>
        <a href="../login.html" data-logout>${icon('logout')} Keluar</a>
      </div>
    </div>`;

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  document.body.appendChild(backdrop);

  document.title = `${title} · ${ROLE_LABEL[role]} · Yuuki Portal`;
})();

UI.hydrateIcons();
