# Yuuki Portal

**Sistem Informasi Manajemen LPK Yuuki untuk Pelatihan dan Pemberangkatan Kerja ke Jepang.**

Studi kasus: *SENDING ORGANIZATION (SO) LPK YUUKI TRAINING CENTER INDONESIA*
(送り出し機関 勇気研修センターインドネシア), Kuningan, Jawa Barat — <https://lpkyuuki.com/>

Proyek tugas mata kuliah **Desain Web** — dibuat dengan **HTML, CSS, dan JavaScript** murni
(tanpa framework, tanpa database). Data awal ada di `js/data.js`, dan perubahan saat website
dipakai disimpan di `localStorage` browser.

> **Bukan situs resmi.** Ini proyek tugas kuliah. Identitas lembaga (nama, alamat, kontak, 14 bidang kerja,
> berita, pendiri) mengacu pada lpkyuuki.com dan profil Google. Data siswa, sensei, nilai, jadwal,
> pendaftar, dan pembayaran di portal adalah **data contoh**; akun contoh memakai domain `yuuki.test`.

## Aktor & Hak Akses

| Aktor | Hak akses |
|---|---|
| **Pengunjung / Calon siswa** (publik) | Melihat profil LPK, program, 14 bidang kerja, berita, dan kontak; mengisi formulir pendaftaran |
| **Admin LPK** | Dashboard statistik, memeriksa dan memverifikasi pendaftar baru, CRUD data siswa & sensei, impor/ekspor Excel data siswa, kelola kelas & jadwal (dengan deteksi bentrok), verifikasi pembayaran, verifikasi berkas keberangkatan, kelola pengumuman, cetak laporan, lihat dan ubah profil |
| **Sensei** | Dashboard mengajar, melihat kelas & siswa yang diampu, input absensi, input nilai (rata-rata & predikat otomatis), unggah materi, kirim pengumuman ke kelas, lihat dan ubah profil |
| **Siswa** | Dashboard progres & status keberangkatan, jadwal, unduh materi, lihat nilai, lihat tagihan & unggah bukti bayar, unggah berkas (paspor, KTP, dll.), ubah profil & kata sandi |

Hak akses dijaga oleh `js/guard.js`: membuka halaman milik peran lain akan dialihkan ke halaman login
dengan pesan "Akses ditolak". Siswa tidak dapat melihat data siswa lain, dan Sensei tidak dapat
membuka menu pembayaran.

### Keterkaitan antar aktor (alur data)

```
Calon siswa daftar ──► Admin periksa & putuskan ──► jadi Siswa + tagihan pendaftaran
Siswa unggah bukti bayar / berkas ──► Admin verifikasi ──► status berubah di sisi Siswa
Sensei input absensi & nilai ──► tampil di dashboard Siswa
Admin / Sensei kirim pengumuman ──► tampil di dashboard Siswa (sesuai kelas)
```

## Verifikasi Pendaftar Baru (Admin)

Pendaftar tidak langsung diterima. Di dashboard admin, tombol **Periksa** membuka detail pendaftar
(NIK, tanggal lahir, kontak, pendidikan, program, motivasi) beserta penilaian kelayakan
**Meyakinkan**, **Perlu dicek**, atau **Mencurigakan** untuk membantu admin menilai apakah pendaftar serius.

Pemeriksaan otomatis yang dijalankan:

- Penulisan nama (angka, simbol, ketikan asal seperti *qwerty*)
- Format NIK (16 digit, kode provinsi, pola berurutan atau berulang)
- Kecocokan NIK dengan tanggal lahir dan jenis kelamin
- Usia (minimal 18 tahun)
- Format telepon dan email (termasuk email sekali pakai)
- Kewajaran motivasi (ketikan acak, terlalu singkat, banyak pengulangan)
- Data kembar dengan pendaftar atau siswa lain

Alur keputusan: admin dapat menyimpan **catatan**, menghubungi pendaftar lewat **WhatsApp** untuk meminta
foto KTP, lalu memilih **Terima** atau **Tolak**. Penolakan wajib disertai alasan, dan menerima pendaftar
berlabel *Mencurigakan* meminta konfirmasi tambahan. Pemeriksaan otomatis hanya alat bantu; keputusan
akhir tetap di tangan admin.

## Impor & Ekspor Excel (Admin)

Halaman **Data Siswa** menyediakan tombol **Template**, **Impor Excel**, dan **Ekspor Excel** (pustaka SheetJS,
format `.xlsx`, `.xls`, atau `.csv`). Impor menampilkan pratinjau per baris: baris valid diimpor, baris
bermasalah dilewati beserta keterangannya, dan data kembar ditandai. Ekspor mengikuti pencarian dan filter yang aktif.

## Akun Contoh

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@yuuki.test` | `admin123` |
| Sensei | `sensei@yuuki.test` | `sensei123` |
| Siswa | `siswa@yuuki.test` | `siswa123` |

Menu pengguna (pojok kanan atas dashboard) memiliki pilihan reset untuk mengembalikan data awal.
Bila isi `js/data.js` diubah, data lokal lama di browser direset otomatis saat halaman dibuka lagi
(sesi login tidak ikut terhapus).

## Cara Menjalankan

Tidak perlu instalasi. Buka `index.html` di browser (klik dua kali), atau gunakan ekstensi
*Live Server* di VS Code. Mulai dari `login.html` untuk mencoba setiap peran. Fitur Excel dan font
memerlukan koneksi internet.

## Struktur Folder

```
yuuki-portal/
├── index.html            beranda publik
├── pendaftaran.html      formulir pendaftaran calon siswa
├── login.html            login berbasis peran
├── css/
│   ├── style.css         dasar desain (variabel, tombol, form, tabel)
│   ├── public.css        halaman publik (beranda, pendaftaran, login)
│   ├── dashboard.css     layout & komponen dashboard
│   └── admin.css · sensei.css · siswa.css   warna aksen tiap peran
├── js/
│   ├── data.js           data awal (pengganti database)
│   ├── app.js            Store, Auth, UI, Form, Table, sidebar & topbar
│   ├── guard.js          penjaga hak akses halaman
│   ├── landing.js · pendaftaran.js · login.js
│   ├── profil.js         halaman profil bersama (admin, sensei, siswa)
│   └── admin/ · sensei/ · siswa/   satu file JS per halaman
├── admin/    (8 halaman)
├── sensei/   (6 halaman)
├── siswa/    (7 halaman)
└── img/logo.svg
```

## Fitur JavaScript

- Login simulasi + penjaga hak akses per peran
- CRUD (tambah, ubah, hapus) dengan modal dan konfirmasi
- Validasi formulir dengan pesan error berbahasa Indonesia
- Pencarian dan filter tabel secara langsung
- Halaman profil di menu pengguna: lihat data akun, ubah data diri, ganti kata sandi (semua peran)
- Pemeriksaan otomatis kelayakan pendaftar dan modal verifikasi
- Impor dan ekspor Excel dengan pratinjau dan validasi per baris
- Deteksi jadwal bentrok (sensei / ruang)
- Hitung otomatis rata-rata nilai, predikat, progres, dan sisa tagihan
- Penyimpanan data di `localStorage` dengan reset otomatis saat data awal berubah
- Toast notifikasi, tab, menu responsif, animasi angka, grafik batang dan ring dengan CSS
- Unduh kwitansi dan materi contoh, cetak laporan / rapor (`window.print`)

## Desain

Merah Jepang `#C8102E` (admin), biru `#1D5FD1` (sensei), hijau `#1B8A5A` (siswa), navy `#1B2A41`
untuk sidebar. Font **Poppins** dan **Noto Sans JP**. Layout responsif (sidebar menjadi menu geser di HP).

## Konvensi Commit

Riwayat commit mengikuti progres pengerjaan dengan format *Conventional Commits*:
`chore`, `style`, `feat(<modul>)`, `fix`, `docs`.
