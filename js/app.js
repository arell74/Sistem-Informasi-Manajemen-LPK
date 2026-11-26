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
  tanggal: (iso) => {
    if (!iso) return '-';
    const s = String(iso).includes('T') ? String(iso) : String(iso) + 'T00:00:00';
    const d = new Date(s);
    return isNaN(d) ? String(iso) : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  tanggalPanjang: () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  hariIni: () => ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date().getDay()],
  isoHariIni: () => new Date().toLocaleDateString('sv-SE'),
  inisial: (nama) => {
    const parts = String(nama || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '?';
  },
  nextId: (prefix, list, key = 'id') => {
    const max = (list || []).reduce((m, x) => Math.max(m, parseInt(String(x[key] || '').replace(/^\D+/, ''), 10) || 0), 0);
    return prefix + '-' + String(max + 1).padStart(3, '0');
  },
  terbilang: (n) => {
    n = Math.abs(Math.floor(Number(n) || 0));
    if (n === 0) return 'Nol Rupiah';
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    function baca(num) {
      if (num < 12) return satuan[num];
      if (num < 20) return baca(num - 10) + ' Belas';
      if (num < 100) return baca(Math.floor(num / 10)) + ' Puluh' + (num % 10 ? ' ' + baca(num % 10) : '');
      if (num < 200) return 'Seratus' + (num % 100 ? ' ' + baca(num % 100) : '');
      if (num < 1000) return baca(Math.floor(num / 100)) + ' Ratus' + (num % 100 ? ' ' + baca(num % 100) : '');
      if (num < 2000) return 'Seribu' + (num % 1000 ? ' ' + baca(num % 1000) : '');
      if (num < 1000000) return baca(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 ? ' ' + baca(num % 1000) : '');
      if (num < 1000000000) return baca(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 ? ' ' + baca(num % 1000000) : '');
      if (num < 1000000000000) return baca(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 ? ' ' + baca(num % 1000000000) : '');
      return String(num);
    }
    return (baca(n).trim() + ' Rupiah').replace(/\s+/g, ' ');
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
    return DB[key] !== undefined ? JSON.parse(JSON.stringify(DB[key])) : null;
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
const ROLE_LABEL = { admin: 'Admin LPK', sensei: 'Sensei', siswa: 'Siswa', pimpinan: 'Direktur LPK' };
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
    t.setAttribute('aria-live', 'polite');
    t.style.cursor = 'pointer';
    t.title = 'Klik untuk menutup';
    t.innerHTML = `${icon(tipe === 'ok' ? 'check' : tipe === 'bad' ? 'x' : 'clock')}<span>${esc(pesan)}</span>`;
    const dismiss = () => { t.classList.add('out'); setTimeout(() => t.remove(), 250); };
    t.addEventListener('click', dismiss);
    wadah.appendChild(t);
    setTimeout(dismiss, 3500);
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

/* ---------- Audit Log (Aktivitas Sistem & Admin) ---------- */
const AuditLog = {
  list() {
    return Store.get('audit_logs') || [];
  },
  record(kategori, aksi, detail, status = 'Sukses') {
    const logs = this.list();
    const user = Auth.user();
    const aktor = user ? `${user.nama} (${ROLE_LABEL[user.role] || user.role})` : 'Sistem';
    const entri = {
      id: Fmt.nextId('LOG', logs),
      waktu: new Date().toISOString(),
      aktor,
      kategori,
      aksi,
      detail,
      status
    };
    logs.unshift(entri);
    if (logs.length > 100) logs.pop();
    Store.set('audit_logs', logs);
    return entri;
  },
  exportCSV() {
    const logs = this.list();
    if (!logs.length) { UI.toast('Belum ada log untuk diekspor.', 'bad'); return; }
    const header = ['ID', 'Waktu', 'Aktor', 'Kategori', 'Aksi', 'Detail', 'Status'];
    const rows = logs.map((l) => [
      l.id,
      `"${Fmt.tanggal(l.waktu)} ${new Date(l.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}"`,
      `"${String(l.aktor || '').replace(/"/g, '""')}"`,
      `"${String(l.kategori || '').replace(/"/g, '""')}"`,
      `"${String(l.aksi || '').replace(/"/g, '""')}"`,
      `"${String(l.detail || '').replace(/"/g, '""')}"`,
      l.status
    ]);
    const csv = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-yuuki-${Fmt.isoHariIni()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    UI.toast('Riwayat aktivitas berhasil diekspor ke CSV.');
  }
};

/* ---------- Dokumen Resmi & Cetak (Kwitansi, Rapor, Kop Surat, Stempel) ---------- */
const DocPrint = {
  logoPath() {
    return window.location.pathname.includes('/admin/') ||
           window.location.pathname.includes('/siswa/') ||
           window.location.pathname.includes('/sensei/') ? '../img/logo.png' : 'img/logo.png';
  },

  renderKop() {
    return `
      <div class="kop-surat">
        <img src="${this.logoPath()}" alt="Logo LPK Yuuki" class="kop-logo">
        <div class="kop-teks">
          <h2 class="kop-instansi">SENDING ORGANIZATION (SO) LPK YUUKI TRAINING CENTER INDONESIA</h2>
          <h3 class="kop-kanji">送り出し機関 勇気研修センターインドネシア</h3>
          <p class="kop-legal">Izin Kemenaker RI: No. 2/227/HK.03.01/VIII/2023 · Kemenkumham: AHU-0014229.AH.01.04.Tahun 2021</p>
          <p class="kop-alamat">Jl. Raya Palutungan Blok Parigi, Cisantana, Kec. Cigugur, Kab. Kuningan, Jawa Barat 45552</p>
          <p class="kop-kontak">Telp: 0232-861-1123 / 0821-2003-9019 · Email: info@lpkyuuki.com · Website: https://lpkyuuki.com</p>
        </div>
      </div>
      <div class="kop-garis"></div>`;
  },

  renderStempel(label = 'LUNAS') {
    return `
      <svg class="doc-cap-stempel" viewBox="0 0 160 160">
        <defs>
          <path id="stempelCurveTop" d="M 22 80 A 58 58 0 0 1 138 80"/>
          <path id="stempelCurveBot" d="M 138 80 A 58 58 0 0 1 22 80"/>
        </defs>
        <circle cx="80" cy="80" r="74" stroke="#C8102E" stroke-width="3.5" fill="none" stroke-dasharray="8 3.5"/>
        <circle cx="80" cy="80" r="66" stroke="#C8102E" stroke-width="1.8" fill="none"/>
        <circle cx="80" cy="80" r="46" stroke="#C8102E" stroke-width="1" fill="none"/>
        <text font-size="9.5" font-weight="700" fill="#C8102E" letter-spacing="1">
          <textPath href="#stempelCurveTop" startOffset="50%" text-anchor="middle">LPK YUUKI TRAINING CENTER</textPath>
        </text>
        <text font-size="9.5" font-weight="700" fill="#C8102E" letter-spacing="1.2">
          <textPath href="#stempelCurveBot" startOffset="50%" text-anchor="middle">★ INDONESIA · KUNINGAN ★</textPath>
        </text>
        <g transform="translate(80, 80) rotate(-6)">
          <rect x="-42" y="-13" width="84" height="26" rx="4" fill="none" stroke="#C8102E" stroke-width="2.2"/>
          <text x="0" y="5" font-size="12" font-weight="900" fill="#C8102E" text-anchor="middle" letter-spacing="2">${esc(label)}</text>
        </g>
      </svg>`;
  },

  renderQR(kodeVerif) {
    return `
      <div class="doc-qr-box">
        <svg class="doc-qr-svg" viewBox="0 0 29 29" fill="currentColor">
          <rect width="29" height="29" fill="#FFFFFF"/>
          <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" fill="#0F172A"/>
          <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" fill="#0F172A"/>
          <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" fill="#0F172A"/>
          <rect x="9" y="2" width="2" height="2" fill="#0F172A"/><rect x="13" y="2" width="2" height="2" fill="#0F172A"/><rect x="17" y="2" width="2" height="2" fill="#0F172A"/>
          <rect x="9" y="6" width="2" height="2" fill="#0F172A"/><rect x="15" y="6" width="2" height="2" fill="#0F172A"/><rect x="19" y="6" width="2" height="2" fill="#0F172A"/>
          <rect x="2" y="9" width="2" height="2" fill="#0F172A"/><rect x="6" y="9" width="2" height="2" fill="#0F172A"/><rect x="10" y="9" width="2" height="2" fill="#0F172A"/><rect x="14" y="9" width="2" height="2" fill="#0F172A"/><rect x="18" y="9" width="2" height="2" fill="#0F172A"/><rect x="22" y="9" width="2" height="2" fill="#0F172A"/><rect x="26" y="9" width="2" height="2" fill="#0F172A"/>
          <rect x="4" y="13" width="2" height="2" fill="#0F172A"/><rect x="8" y="13" width="2" height="2" fill="#0F172A"/><rect x="12" y="13" width="2" height="2" fill="#0F172A"/><rect x="16" y="13" width="2" height="2" fill="#0F172A"/><rect x="20" y="13" width="2" height="2" fill="#0F172A"/><rect x="24" y="13" width="2" height="2" fill="#0F172A"/>
          <rect x="2" y="17" width="2" height="2" fill="#0F172A"/><rect x="6" y="17" width="2" height="2" fill="#0F172A"/><rect x="10" y="17" width="2" height="2" fill="#0F172A"/><rect x="14" y="17" width="2" height="2" fill="#0F172A"/><rect x="18" y="17" width="2" height="2" fill="#0F172A"/><rect x="22" y="17" width="2" height="2" fill="#0F172A"/><rect x="26" y="17" width="2" height="2" fill="#0F172A"/>
          <rect x="9" y="21" width="2" height="2" fill="#0F172A"/><rect x="13" y="21" width="2" height="2" fill="#0F172A"/><rect x="17" y="21" width="2" height="2" fill="#0F172A"/><rect x="21" y="21" width="2" height="2" fill="#0F172A"/><rect x="25" y="21" width="2" height="2" fill="#0F172A"/>
          <rect x="9" y="25" width="2" height="2" fill="#0F172A"/><rect x="15" y="25" width="2" height="2" fill="#0F172A"/><rect x="19" y="25" width="2" height="2" fill="#0F172A"/><rect x="25" y="25" width="2" height="2" fill="#0F172A"/>
        </svg>
        <div class="doc-qr-desc">
          <b>VERIFIKASI DIGITAL</b>
          Kode: ${esc(kodeVerif)}<br>
          Pindai untuk memeriksa keaslian dokumen resmi pada server SO LPK Yuuki Training Center Indonesia.
        </div>
      </div>`;
  },

  showModal(contentHtml) {
    let m = $('#modalDocPrint');
    if (!m) {
      m = document.createElement('div');
      m.id = 'modalDocPrint';
      m.className = 'modal';
      m.innerHTML = `
        <div class="modal-box wide" role="dialog" aria-modal="true" style="max-width:880px;padding:1.4rem">
          <div class="modal-head" style="margin-bottom:.8rem;border-bottom:1px solid var(--line);padding-bottom:.8rem">
            <h3>Pratinjau Dokumen Resmi</h3>
            <div style="display:flex;gap:.5rem;align-items:center">
              <button type="button" class="btn btn-primary btn-sm" id="btnTriggerPrint">${icon('printer')} Cetak / Simpan PDF</button>
              <button type="button" class="icon-btn" data-close aria-label="Tutup">${icon('x')}</button>
            </div>
          </div>
          <div class="modal-body" id="docPrintContainer" style="overflow-x:auto;padding:.4rem 0"></div>
        </div>`;
      document.body.appendChild(m);
      $('#btnTriggerPrint', m).addEventListener('click', () => this.print());
    }
    $('#docPrintContainer', m).innerHTML = contentHtml;
    Modal.open('#modalDocPrint');
  },

  print() {
    document.body.classList.add('printing-official-doc');
    window.print();
    const cleanup = () => {
      document.body.classList.remove('printing-official-doc');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 2000);
  },

  kwitansi(bayar, siswa) {
    if (!bayar) return;
    if (!siswa) {
      const siswaList = Store.get('siswa') || [];
      siswa = siswaList.find((s) => s.id === bayar.siswa) || { id: bayar.siswa, nama: bayar.siswa, kelas: '-', program: 'MGN' };
    }
    const programNama = {
      'MGN': 'Program Pemagangan ke Jepang',
      'BHS': 'Pendidikan Bahasa & Budaya Jepang',
      'KRY': 'Bahasa Jepang untuk Karyawan'
    }[siswa.program] || siswa.program;

    const tglTerbit = Fmt.tanggal(bayar.tanggal || Fmt.isoHariIni());
    const kodeVerif = `YUK-INV-${bayar.id}-${(bayar.tanggal || '').replace(/-/g, '')}`;

    const html = `
      <div class="doc-sheet">
        ${this.renderKop()}
        <h3 class="doc-title">KWITANSI PEMBAYARAN RESMI (領収書)</h3>
        <p class="doc-subtitle">Nomor Dokumen: ${esc(bayar.id)} / YUK-FIN / ${new Date().getFullYear()}</p>

        <div class="doc-meta">
          <div class="doc-meta-item"><b>No. Invoice</b><span>: ${esc(bayar.id)}</span></div>
          <div class="doc-meta-item"><b>Tanggal Bayar</b><span>: ${tglTerbit}</span></div>
          <div class="doc-meta-item"><b>Terima Dari</b><span>: ${esc(siswa.nama)} (${esc(siswa.id)})</span></div>
          <div class="doc-meta-item"><b>Program / Kelas</b><span>: ${esc(programNama)} / ${esc(siswa.kelas || '-')}</span></div>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th style="width:40px">No</th>
              <th>Keterangan Pembayaran</th>
              <th>Metode Pembayaran</th>
              <th style="text-align:right">Status</th>
              <th style="text-align:right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${esc(bayar.ket)}</strong><br><small style="color:#64748B">Pelatihan & Persiapan Pemagangan SO LPK Yuuki</small></td>
              <td>${esc(bayar.metode || 'Transfer Bank')}</td>
              <td style="text-align:right"><span style="color:#059669;font-weight:700">LUNAS</span></td>
              <td class="num" style="font-weight:700">${Fmt.rupiah(bayar.jumlah)}</td>
            </tr>
            <tr class="doc-total-row">
              <td colspan="4" style="text-align:right">TOTAL DITERIMA</td>
              <td class="num" style="font-size:1.05rem;color:#0F172A">${Fmt.rupiah(bayar.jumlah)}</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-terbilang">
          <b>Terbilang:</b> #${Fmt.terbilang(bayar.jumlah)}#
        </div>

        <div class="doc-sign-wrap">
          ${this.renderQR(kodeVerif)}
          <div class="doc-signer">
            <p>Kuningan, ${tglTerbit}</p>
            <p style="font-weight:600;margin-top:.15rem">Bagian Administrasi Keuangan</p>
            <div class="doc-sign-space"></div>
            ${this.renderStempel('LUNAS')}
            <span class="doc-sign-name">Rina Kusuma</span>
            <p style="font-size:.76rem;color:#64748B">NIP. YUK-2021-ADM01</p>
          </div>
        </div>
      </div>`;

    this.showModal(html);
  },

  rapor(siswa, nilai, ujian = [], sensei = null) {
    if (!siswa) return;
    if (!nilai) {
      const allNilai = Store.get('nilai') || {};
      nilai = allNilai[siswa.id] || { kosakata: 75, kanji: 70, tata: 75, listening: 70, kaiwa: 75 };
    }
    if (!ujian || !ujian.length) {
      const allUjian = Store.get('ujian') || [];
      ujian = allUjian.filter((u) => u.siswa === siswa.id);
    }
    const senseiList = Store.get('sensei') || [];
    const guru = sensei || senseiList[0] || { nama: 'Tanaka Hiroshi', spesialisasi: 'Bahasa Jepang N5' };

    const MAPEL = [
      { key: 'kosakata', label: 'Kosakata Bahasa Jepang (Goi / 語彙)', level: 'N5' },
      { key: 'kanji', label: 'Aksara Kanji Dasar (Kanji / 漢字)', level: 'N5' },
      { key: 'tata', label: 'Tata Bahasa & Pola Kalimat (Bunpou / 文法)', level: 'N5' },
      { key: 'listening', label: 'Pemahaman Menyimak (Choukai / 聴解)', level: 'N5' },
      { key: 'kaiwa', label: 'Percakapan & Ungkapan Praktis (Kaiwa / 会話)', level: 'Praktik' }
    ];

    const entriNilai = Object.entries(nilai);
    const rata = Math.round(entriNilai.reduce((t, [, v]) => t + v, 0) / (entriNilai.length || 1));
    const predikat = rata >= 85 ? 'A (Sangat Baik / 優)' : rata >= 75 ? 'B (Baik / 良)' : rata >= 65 ? 'C (Cukup / 可)' : 'D (Perlu Bimbingan / 不可)';
    const kelayakan = rata >= 75 ? 'MEMENUHI SYARAT EVALUASI TAHAP INI' : 'DIANJURKAN PENGAYAAN / REMEDIAL';
    const kodeVerif = `YUK-RAPOR-${siswa.id}-${Fmt.isoHariIni().replace(/-/g, '')}`;

    const html = `
      <div class="doc-sheet">
        ${this.renderKop()}
        <h3 class="doc-title">LEMBAR EVALUASI BELAJAR SISWA (成績評価証明書)</h3>
        <p class="doc-subtitle">Laporan Hasil Penilaian Pelatihan Bahasa & Budaya Jepang — Periode Berjalan 2026</p>

        <div class="doc-meta">
          <div class="doc-meta-item"><b>Nama Siswa</b><span>: ${esc(siswa.nama)}</span></div>
          <div class="doc-meta-item"><b>NIS / ID Siswa</b><span>: ${esc(siswa.id)}</span></div>
          <div class="doc-meta-item"><b>Kelas Pelatihan</b><span>: ${esc(siswa.kelas)} (Wali: ${esc(guru.nama)})</span></div>
          <div class="doc-meta-item"><b>Bidang Pemagangan</b><span>: ${esc(siswa.bidang || 'Umum')}</span></div>
        </div>

        <table class="doc-table">
          <thead>
            <tr>
              <th style="width:40px">No</th>
              <th>Komponen Evaluasi Kompetensi</th>
              <th style="width:70px">Standar</th>
              <th style="text-align:right;width:85px">Nilai</th>
              <th style="text-align:center;width:110px">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${MAPEL.map((m, idx) => {
              const val = nilai[m.key] || 0;
              const ket = val >= 75 ? 'Tuntas' : 'Perlu Latihan';
              const color = val >= 75 ? '#059669' : '#D97706';
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${esc(m.label)}</strong></td>
                  <td>${esc(m.level)}</td>
                  <td class="num" style="font-weight:700">${val}</td>
                  <td style="text-align:center;color:${color};font-weight:600">${ket}</td>
                </tr>`;
            }).join('')}
            <tr class="doc-total-row">
              <td colspan="3" style="text-align:right">NILAI RATA-RATA KOMPETENSI</td>
              <td class="num" style="font-size:1.05rem;color:#0F172A">${rata}</td>
              <td style="text-align:center;font-weight:700">${predikat.split(' ')[0]}</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-terbilang" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
          <div><b>Predikat Keseluruhan:</b> ${predikat}</div>
          <div style="font-weight:700;color:${rata >= 75 ? '#059669' : '#D97706'}">Status: ${kelayakan}</div>
        </div>

        ${ujian.length ? `
          <div style="margin-bottom:1.3rem">
            <h5 style="margin:0 0 .5rem;font-size:.82rem;color:#475569;text-transform:uppercase;letter-spacing:.04em">Riwayat Evaluasi Bulanan & Simulasi Tes:</h5>
            <div style="display:flex;gap:.8rem;flex-wrap:wrap">
              ${ujian.map((u) => `
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;padding:.45rem .75rem;font-size:.78rem">
                  <span style="color:#64748B">${esc(u.nama)} (${Fmt.tanggal(u.tanggal)}):</span>
                  <b style="color:#0F172A;margin-left:.3rem;font-size:.85rem">${u.skor} / 100</b>
                </div>`).join('')}
            </div>
          </div>` : ''}

        <div class="doc-sign-wrap">
          ${this.renderQR(kodeVerif)}
          <div style="display:flex;gap:2rem">
            <div class="doc-signer">
              <p>Pengajar / Sensei</p>
              <div class="doc-sign-space"></div>
              <span class="doc-sign-name">${esc(guru.nama)}</span>
              <p style="font-size:.76rem;color:#64748B">Instruktur Bahasa Jepang</p>
            </div>
            <div class="doc-signer">
              <p>Kuningan, ${Fmt.tanggalPanjang()}</p>
              <p style="font-weight:600;margin-top:.15rem">Direktur LPK Yuuki</p>
              <div class="doc-sign-space"></div>
              ${this.renderStempel('DISAHKAN')}
              <span class="doc-sign-name">Sopyan Komarudin, S.Kep.</span>
              <p style="font-size:.76rem;color:#64748B">Pimpinan Lembaga</p>
            </div>
          </div>
        </div>
      </div>`;

    this.showModal(html);
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
['input', 'change'].forEach((evt) => {
  document.addEventListener(evt, (e) => {
    const field = e.target.closest('.field.invalid');
    if (field && e.target.checkValidity()) Form.setError(field, '');
  });
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
    { href: 'mitra-jepang',     label: 'Mitra Jepang',      icon: 'plane' },
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
  ],
  pimpinan: [
    { href: 'dashboard',   label: 'Dashboard Eksekutif', icon: 'dashboard' },
    { href: 'persetujuan', label: 'Persetujuan (Approval)', icon: 'checksq' },
    { href: 'laporan',     label: 'Laporan Kinerja SO',  icon: 'printer' },
    { href: 'profil',      label: 'Profil Saya',         icon: 'user' }
  ]
};

(function renderShell() {
  const { role, page, title } = document.documentElement.dataset;
  const sidebar = $('#sidebar'), topbar = $('#topbar');
  if (!role || !sidebar || !topbar) return;

  const user = Auth.user();
  if (!user || user.role !== role) return; // guard.js sudah mengalihkan halaman

  sidebar.innerHTML = `
    <a class="brand" href="dashboard.html"><img class="brand-mark" src="../img/logo-mark.svg" alt="Yuuki"><span><strong>Yuuki</strong><small>${ROLE_LABEL[role]}</small></span></a>
    <nav class="nav" aria-label="Menu utama">
      ${MENUS[role].map((m) => `<a href="${m.href}.html" class="${m.href === page ? 'active' : ''}"${m.href === page ? ' aria-current="page"' : ''}>${icon(m.icon)}<span>${m.label}</span></a>`).join('')}
    </nav>
    <div class="sidebar-foot"><a href="../login.html" data-logout>${icon('logout')}<span>Keluar</span></a></div>`;

  topbar.innerHTML = `
    <button class="icon-btn menu-toggle" aria-label="Buka menu">${icon('menu')}</button>
    <div class="topbar-title"><h1>${esc(title || '')}</h1><p>${Fmt.tanggalPanjang()}</p></div>
    <div style="display:flex;align-items:center;gap:.5rem">
      <button class="btn btn-sm btn-outline pwa-topbar-install" id="pwaTopbarBtn" style="display:none"><span data-icon="download"></span> Pasang App</button>
      <div class="user-wrap">
        <button class="user-btn" aria-haspopup="true">
          <span class="avatar">${esc(Fmt.inisial(user.nama))}</span>
          <span class="who"><strong>${esc(user.nama)}</strong><small>${esc(user.jabatan)}</small></span>
        </button>
        <div class="user-menu">
          <a href="profil.html">${icon('user')} Profil Saya</a>
          <a href="#" id="pwaInstallBtn" style="display:none">${icon('download')} Pasang Aplikasi (PWA)</a>
          <a href="../index.html">${icon('pin')} Ke website utama</a>
          <a href="#" data-reset-demo>${icon('clock')} Reset Data</a>
          <a href="../login.html" data-logout>${icon('logout')} Keluar</a>
        </div>
      </div>
    </div>`;

  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  document.body.appendChild(backdrop);

  document.title = `${title} · ${ROLE_LABEL[role]} · Yuuki Portal`;
})();

/* ---------- 8. Progressive Web App (PWA) Handler ---------- */
const PWA = {
  deferredPrompt: null,
  init() {
    if ('serviceWorker' in navigator) {
      const swPath = window.location.pathname.includes('/admin/') ||
                     window.location.pathname.includes('/siswa/') ||
                     window.location.pathname.includes('/sensei/') ? '../sw.js' : './sw.js';
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath).then((reg) => {
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  UI.toast('Pembaruan versi portal tersedia. Muat ulang halaman.', 'info');
                }
              };
            }
          };
        }).catch(() => {});
      });
    }

    window.addEventListener('offline', () => {
      UI.toast('Mode offline aktif. Anda tetap dapat mengakses jadwal dan materi tersimpan.', 'warn');
      document.body.classList.add('is-offline');
    });
    window.addEventListener('online', () => {
      UI.toast('Koneksi internet terhubung kembali.', 'ok');
      document.body.classList.remove('is-offline');
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const btnMenu = $('#pwaInstallBtn');
      const btnTop = $('#pwaTopbarBtn');
      if (btnMenu) btnMenu.style.display = 'flex';
      if (btnTop) btnTop.style.display = 'inline-flex';
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('#pwaInstallBtn') || e.target.closest('#pwaTopbarBtn')) {
        e.preventDefault();
        if (!this.deferredPrompt) {
          UI.toast('Aplikasi sudah terpasang atau gunakan menu browser Anda.', 'info');
          return;
        }
        this.deferredPrompt.prompt();
        this.deferredPrompt.userChoice.then((choice) => {
          if (choice && choice.outcome === 'accepted') {
            UI.toast('Terima kasih telah memasang Yuuki Portal!');
          }
          this.deferredPrompt = null;
          const btnMenu = $('#pwaInstallBtn');
          const btnTop = $('#pwaTopbarBtn');
          if (btnMenu) btnMenu.style.display = 'none';
          if (btnTop) btnTop.style.display = 'none';
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      UI.toast('Yuuki Portal berhasil dipasang di layar utama! 🎉');
      this.deferredPrompt = null;
    });
  }
};
PWA.init();

UI.hydrateIcons();
