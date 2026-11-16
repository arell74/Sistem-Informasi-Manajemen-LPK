/* =====================================================
   data.js — Data dummy (pengganti database)
   Identitas lembaga mengacu pada lpkyuuki.com & profil Google;
   data siswa, sensei, nilai, dan pembayaran hanyalah contoh.
   Perubahan data saat website dipakai disimpan di localStorage
   (lihat Store di app.js), bukan di file ini.
   ===================================================== */

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TAHAP = ['Pendaftaran', 'Pelatihan Bahasa', 'Kelengkapan Berkas', 'Seleksi & Wawancara', 'Pengurusan Visa', 'Keberangkatan'];
const DOKUMEN = ['Paspor', 'KTP', 'Ijazah', 'Surat Sehat', 'SKCK', 'Pas Foto'];
const BIDANG = ['Perawat', 'Pembangunan', 'Pertanian', 'Pembuatan Kapal', 'Perikanan', 'Pembuatan Bahan Makanan dan Minuman', 'Restoran', 'Penginapan', 'Material Industri', 'Industri Mesin', 'Pembersih Bangunan', 'Teknik Listrik', 'Penerbangan', 'Pemeliharaan Mobil'];
const KELAS_UMUM = ['K-KAI', 'K-BUD', 'K-INT']; // kelas yang diikuti semua siswa

// helper pembuat data agar baris data lebih ringkas
const J = (hari, jam, kelas, mapel, sensei, ruang) => ({ hari, jam, kelas, mapel, sensei, ruang });
const N = (kosakata, kanji, tata, listening, kaiwa) => ({ kosakata, kanji, tata, listening, kaiwa });

const DB = {
  lpk: {
    nama: 'Yuuki Training Center Indonesia',
    lengkap: 'SENDING ORGANIZATION (SO) LPK YUUKI TRAINING CENTER INDONESIA',
    jepang: '送り出し機関 勇気研修センターインドネシア',
    tagline: 'Tingkatkan Potensi Karir Masa Depan bersama Kami',
    pendiri: 'Sopyan Komarudin, S.Kep.',
    alamat: 'Jl. Raya Palutungan Blok Parigi, Cisantana, Kec. Cigugur, Kabupaten Kuningan, Jawa Barat 45552',
    telepon: '0232-861-1123',
    telepon2: '0821-2003-9019',
    situs: 'https://lpkyuuki.com/'
  },

  /* ---------- Akun demo (satu per aktor) ---------- */
  users: {
    admin:  { id: 'A-001', nama: 'Rina Kusuma',    jabatan: 'Admin LPK',            email: 'admin@yuuki.test',  password: 'admin123' },
    sensei: { id: 'T-001', nama: 'Tanaka Hiroshi', jabatan: 'Sensei Bahasa Jepang', email: 'sensei@yuuki.test', password: 'sensei123' },
    siswa:  { id: 'S-001', nama: 'Budi Santoso',   jabatan: 'Peserta Pemagangan',  email: 'siswa@yuuki.test',  password: 'siswa123' }
  },

  program: [
    { kode: 'MGN', nama: 'Program Pemagangan ke Jepang' },
    { kode: 'BHS', nama: 'Pendidikan Bahasa & Budaya Jepang' },
    { kode: 'KRY', nama: 'Bahasa Jepang untuk Karyawan Perusahaan' }
  ],

  kelas: [
    { id: 'K-N5A', nama: 'N5 Reguler A',          level: 'N5', sensei: 'T-001', ruang: 'Ruang Sakura',  kuota: 20, jenis: 'utama' },
    { id: 'K-N5B', nama: 'N5 Reguler B (Sore)',   level: 'N5', sensei: 'T-001', ruang: 'Ruang Sakura 2', kuota: 20, jenis: 'utama' },
    { id: 'K-N4A', nama: 'N4 Lanjutan',           level: 'N4', sensei: 'T-001', ruang: 'Ruang Ume',     kuota: 15, jenis: 'utama' },
    { id: 'K-KAI', nama: 'Kaiwa (Percakapan)',    level: 'Semua', sensei: 'T-003', ruang: 'Ruang Fuji',  kuota: 40, jenis: 'umum' },
    { id: 'K-BUD', nama: 'Budaya & Etika Kerja',  level: 'Semua', sensei: 'T-004', ruang: 'Ruang Momiji', kuota: 40, jenis: 'umum' },
    { id: 'K-INT', nama: 'Persiapan Wawancara',   level: 'Semua', sensei: 'T-005', ruang: 'Ruang Fuji',  kuota: 40, jenis: 'umum' }
  ],

  sensei: [
    { id: 'T-001', nama: 'Tanaka Hiroshi',   asal: 'Jepang',    spesialisasi: 'Bahasa Jepang N5–N4',     telepon: '0812-1000-0001', email: 'sensei@yuuki.test',  status: 'Aktif' },
    { id: 'T-002', nama: 'Sari Wulandari',   asal: 'Indonesia', spesialisasi: 'Kanji & Kosakata',        telepon: '0812-1000-0002', email: 'sari@yuuki.test',    status: 'Aktif' },
    { id: 'T-003', nama: 'Sato Yuki',        asal: 'Jepang',    spesialisasi: 'Kaiwa (Percakapan)',      telepon: '0812-1000-0003', email: 'sato@yuuki.test',    status: 'Aktif' },
    { id: 'T-004', nama: 'Dewi Lestari',     asal: 'Indonesia', spesialisasi: 'Budaya & Etika Kerja',    telepon: '0812-1000-0004', email: 'dewi@yuuki.test',    status: 'Aktif' },
    { id: 'T-005', nama: 'Kobayashi Ken',    asal: 'Jepang',    spesialisasi: 'Persiapan Wawancara',     telepon: '0812-1000-0005', email: 'ken@yuuki.test',     status: 'Cuti' }
  ],

  siswa: [
    { id: 'S-001', nama: 'Muhamad Farel Fauzan',    kelas: 'K-N5A', program: 'MGN', bidang: 'Restoran', telepon: '0812-3456-7801', email: 'siswa@yuuki.test',  kota: 'Bandung',    lahir: '2002-04-12', status: 'Aktif',          progres: 68, tahap: 1 },
    { id: 'S-002', nama: 'Nova Shabilla',  kelas: 'K-N5A', program: 'MGN', bidang: 'Perawat', telepon: '0812-3456-7802', email: 'siti@mail.com',   kota: 'Cirebon',    lahir: '2001-09-03', status: 'Aktif',          progres: 74, tahap: 1 },
    { id: 'S-003', nama: 'Muhamad Shalih Fauzan',   kelas: 'K-N5A', program: 'MGN', bidang: 'Pertanian', telepon: '0812-3456-7803', email: 'agus@mail.com',   kota: 'Semarang',   lahir: '2003-01-21', status: 'Aktif',          progres: 55, tahap: 1 },
    { id: 'S-004', nama: 'Azril Alghiffari',  kelas: 'K-N5B', program: 'BHS', telepon: '0812-3456-7804', email: 'dewi@mail.com',   kota: 'Bogor',      lahir: '2000-12-30', status: 'Aktif',          progres: 60, tahap: 1 },
    { id: 'S-005', nama: 'Rizky Riaadha Rismandana',  kelas: 'K-N5B', program: 'MGN', bidang: 'Pembuatan Bahan Makanan dan Minuman', telepon: '0812-3456-7805', email: 'rizky@mail.com',  kota: 'Bekasi',     lahir: '2002-06-18', status: 'Aktif',          progres: 48, tahap: 1 },
    { id: 'S-006', nama: 'Anastasya Lena',        kelas: 'K-N4A', program: 'MGN', bidang: 'Penginapan', telepon: '0812-3456-7806', email: 'nur@mail.com',    kota: 'Malang',     lahir: '2001-02-14', status: 'Aktif',          progres: 82, tahap: 2 },
    { id: 'S-007', nama: 'Mochamad Ilham Dwi Cahyana',   kelas: 'K-N4A', program: 'MGN', bidang: 'Industri Mesin', telepon: '0812-3456-7807', email: 'fajar@mail.com',  kota: 'Surabaya',   lahir: '2000-08-09', status: 'Siap Berangkat', progres: 95, tahap: 3 },
    { id: 'S-008', nama: 'Adwiyana Nugraha',  kelas: 'K-N4A', program: 'MGN', bidang: 'Perawat', telepon: '0812-3456-7808', email: 'putri@mail.com',  kota: 'Yogyakarta', lahir: '2001-11-25', status: 'Siap Berangkat', progres: 97, tahap: 4 },
    { id: 'S-009', nama: 'Rafsan Zaini Anwar',      kelas: 'K-N5B', program: 'KRY', telepon: '0812-3456-7809', email: 'eko@mail.com',    kota: 'Solo',       lahir: '1999-05-05', status: 'Cuti',           progres: 30, tahap: 1 },
    { id: 'S-010', nama: 'Rehan Janwar Pratama',    kelas: 'K-N5A', program: 'BHS', telepon: '0812-3456-7810', email: 'lina@mail.com',   kota: 'Depok',      lahir: '2002-10-02', status: 'Aktif',          progres: 62, tahap: 1 }
  ],

  jadwal: [
    J('Senin',  '08.00–10.00', 'K-N5A', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura'),
    J('Rabu',   '08.00–10.00', 'K-N5A', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura'),
    J('Jumat',  '08.00–10.00', 'K-N5A', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura'),
    J('Selasa', '13.00–15.00', 'K-N5B', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura 2'),
    J('Kamis',  '13.00–15.00', 'K-N5B', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura 2'),
    J('Sabtu',  '13.00–15.00', 'K-N5B', 'Bahasa Jepang N5',        'T-001', 'Ruang Sakura 2'),
    J('Senin',  '13.00–15.00', 'K-N4A', 'Bahasa Jepang N4',        'T-001', 'Ruang Ume'),
    J('Rabu',   '13.00–15.00', 'K-N4A', 'Bahasa Jepang N4',        'T-001', 'Ruang Ume'),
    J('Jumat',  '10.30–12.30', 'K-N4A', 'Bahasa Jepang N4',        'T-001', 'Ruang Ume'),
    J('Selasa', '10.30–12.30', 'K-KAI', 'Kaiwa (Percakapan)',      'T-003', 'Ruang Fuji'),
    J('Kamis',  '10.30–12.30', 'K-KAI', 'Kaiwa (Percakapan)',      'T-003', 'Ruang Fuji'),
    J('Rabu',   '10.30–12.00', 'K-BUD', 'Budaya & Etika Kerja',    'T-004', 'Ruang Momiji'),
    J('Sabtu',  '08.00–10.00', 'K-BUD', 'Budaya & Etika Kerja',    'T-004', 'Ruang Momiji'),
    J('Kamis',  '15.30–17.00', 'K-INT', 'Persiapan Wawancara',     'T-005', 'Ruang Fuji'),
    J('Sabtu',  '10.30–12.30', 'K-INT', 'Persiapan Wawancara',     'T-005', 'Ruang Fuji')
  ],

  pembayaran: [
    { id: 'INV-001', siswa: 'S-001', ket: 'Biaya pendaftaran', jumlah: 1000000, tanggal: '2026-08-20', metode: 'Transfer BCA',     status: 'Lunas' },
    { id: 'INV-002', siswa: 'S-001', ket: 'Cicilan 1',         jumlah: 3000000, tanggal: '2026-09-10', metode: 'Transfer BCA',     status: 'Lunas' },
    { id: 'INV-003', siswa: 'S-001', ket: 'Cicilan 2',         jumlah: 3000000, tanggal: '2026-10-10', metode: 'Transfer Mandiri', status: 'Menunggu' },
    { id: 'INV-004', siswa: 'S-001', ket: 'Cicilan 3',         jumlah: 3000000, tanggal: '2026-11-30', metode: '-',                status: 'Belum' },
    { id: 'INV-005', siswa: 'S-001', ket: 'Pelunasan',         jumlah: 2000000, tanggal: '2026-12-30', metode: '-',                status: 'Belum' },
    { id: 'INV-006', siswa: 'S-002', ket: 'Biaya pendaftaran', jumlah: 1000000, tanggal: '2026-08-22', metode: 'Tunai',            status: 'Lunas' },
    { id: 'INV-007', siswa: 'S-002', ket: 'Cicilan 1',         jumlah: 3000000, tanggal: '2026-10-12', metode: 'Transfer BCA',     status: 'Menunggu' },
    { id: 'INV-008', siswa: 'S-003', ket: 'Biaya pendaftaran', jumlah: 1000000, tanggal: '2026-09-01', metode: 'Tunai',            status: 'Lunas' },
    { id: 'INV-009', siswa: 'S-004', ket: 'Pelunasan kursus',  jumlah: 4500000, tanggal: '2026-09-15', metode: 'Transfer BRI',     status: 'Lunas' },
    { id: 'INV-010', siswa: 'S-005', ket: 'Cicilan 1',         jumlah: 3000000, tanggal: '2026-10-30', metode: '-',                status: 'Belum' },
    { id: 'INV-011', siswa: 'S-006', ket: 'Cicilan 3',         jumlah: 3000000, tanggal: '2026-10-05', metode: 'Transfer BCA',     status: 'Lunas' },
    { id: 'INV-012', siswa: 'S-007', ket: 'Pelunasan',         jumlah: 2000000, tanggal: '2026-10-20', metode: 'Transfer Mandiri', status: 'Lunas' },
    { id: 'INV-013', siswa: 'S-008', ket: 'Pelunasan',         jumlah: 2000000, tanggal: '2026-10-22', metode: 'Transfer BCA',     status: 'Menunggu' }
  ],

  berkas: [], // dibuat otomatis di bawah

  /* nilai per siswa: skala 0–100 */
  nilai: {
    'S-001': N(72, 65, 70, 68, 75), 'S-002': N(80, 74, 78, 72, 81), 'S-003': N(60, 55, 58, 62, 64),
    'S-004': N(70, 66, 68, 64, 72), 'S-005': N(52, 48, 55, 50, 58), 'S-006': N(85, 82, 80, 78, 84),
    'S-007': N(92, 90, 88, 86, 91), 'S-008': N(95, 93, 94, 90, 96), 'S-009': N(40, 35, 42, 38, 45),
    'S-010': N(68, 62, 66, 60, 70)
  },

  ujian: [
    { siswa: 'S-001', nama: 'Ujian Bulanan September', tanggal: '2026-09-26', skor: 58 },
    { siswa: 'S-001', nama: 'Ujian Bulanan Oktober',   tanggal: '2026-10-24', skor: 66 },
    { siswa: 'S-001', nama: 'Simulasi Ujian Bahasa 1',    tanggal: '2026-11-07', skor: 71 }
  ],

  materi: [
    { id: 'M-001', judul: 'Hiragana & Katakana — Lembar Latihan', kelas: 'K-N5A', jenis: 'PDF',   ukuran: '1.8 MB',  tanggal: '2026-10-02', oleh: 'T-001' },
    { id: 'M-002', judul: 'Ringkasan Bab 1–5 (Minna no Nihongo)',  kelas: 'K-N5A', jenis: 'PDF',   ukuran: '3.2 MB',  tanggal: '2026-10-16', oleh: 'T-001' },
    { id: 'M-003', judul: 'Audio Listening N5 — Bab 3',            kelas: 'K-N5A', jenis: 'Audio', ukuran: '12.4 MB', tanggal: '2026-11-02', oleh: 'T-001' },
    { id: 'M-004', judul: 'Kosakata Dapur & Restoran',             kelas: 'K-N5B', jenis: 'Slide', ukuran: '4.1 MB',  tanggal: '2026-10-28', oleh: 'T-001' },
    { id: 'M-005', judul: 'Latihan Kanji N4 (Set 2)',              kelas: 'K-N4A', jenis: 'PDF',   ukuran: '2.0 MB',  tanggal: '2026-11-03', oleh: 'T-001' },
    { id: 'M-006', judul: 'Etika Kerja di Jepang (Hou-Ren-Sou)',   kelas: 'K-BUD', jenis: 'Slide', ukuran: '5.6 MB',  tanggal: '2026-10-21', oleh: 'T-004' },
    { id: 'M-007', judul: 'Simulasi Wawancara Kerja',              kelas: 'K-INT', jenis: 'Video', ukuran: '48 MB',   tanggal: '2026-11-05', oleh: 'T-005' },
    { id: 'M-008', judul: 'Percakapan Sehari-hari (Kaiwa 1)',      kelas: 'K-KAI', jenis: 'Video', ukuran: '36 MB',   tanggal: '2026-10-30', oleh: 'T-003' }
  ],

  pengumuman: [
    { id: 'P-001', judul: 'Ujian Bulanan November', target: 'Semua', penulis: 'Admin LPK', tanggal: '2026-11-08',
      isi: 'Ujian bulanan dilaksanakan Sabtu, 21 November 2026 pukul 08.00 di Ruang Sakura. Harap membawa alat tulis.' },
    { id: 'P-002', judul: 'Pengingat Cicilan Bulan November', target: 'Siswa', penulis: 'Admin LPK', tanggal: '2026-11-05',
      isi: 'Cicilan ke-3 jatuh tempo 30 November 2026. Unggah bukti pembayaran lewat menu Pembayaran.' },
    { id: 'P-003', judul: 'Rapat Koordinasi Sensei', target: 'Sensei', penulis: 'Admin LPK', tanggal: '2026-11-04',
      isi: 'Rapat evaluasi kurikulum Jumat pukul 16.00 di ruang guru.' },
    { id: 'P-004', judul: 'Tugas Kanji Minggu Ini', target: 'K-N5A', penulis: 'Tanaka Hiroshi', tanggal: '2026-11-09',
      isi: 'Kerjakan latihan kanji halaman 12–15 dan kumpulkan pada pertemuan berikutnya.' }
  ],

  /* Data pendaftar lengkap seperti isian formulir. NIK dibuat konsisten dengan
     tanggal lahir (digit 7-12: hari, bulan, tahun; perempuan hari +40) kecuali
     disengaja berbeda untuk contoh verifikasi. */
  pendaftar: [
    { kode: 'REG-0006', nama: 'Miftar Nur Alfian', nik: '3208011403000012', jk: 'L', lahir: '2000-03-14', kota: 'Kuningan',
      telepon: '0857-2210-4417', email: 'tatah77@gmail.com', pendidikan: 'SMA / SMK / Sederajat',
      program: 'MGN', bidang: 'Industri Mesin',
      motivasi: 'Saya lulusan SMK Teknik Mesin dan sudah dua tahun bekerja di bengkel. Saya ingin menambah keterampilan dan pengalaman kerja di Jepang, serta membantu biaya sekolah adik saya.',
      tanggal: '2026-11-09', status: 'Baru', catatan: '' },
    { kode: 'REG-0005', nama: 'Karla Puspa Kaldera', nik: '3209026107990003', jk: 'P', lahir: '2002-07-21', kota: 'Cirebon',
      telepon: '0821-3345-9082', email: 'karlaa202@gmail.com', pendidikan: 'D3',
      program: 'BHS', bidang: '',
      motivasi: 'Saya ingin belajar bahasa Jepang dari dasar karena tertarik dengan budaya kerja di sana.',
      tanggal: '2026-11-08', status: 'Baru', catatan: '' },
    { kode: 'REG-0004', nama: 'Qwerty Asdfgh', nik: '1234567890123456', jk: 'L', lahir: '2005-01-01', kota: 'Test',
      telepon: '0811-1111-1111', email: 'qwerty123@mailinator.com', pendidikan: 'SMA / SMK / Sederajat',
      program: 'MGN', bidang: '',
      motivasi: 'asdfghjkl asdfghjkl asdfghjkl asdfghjkl',
      tanggal: '2026-11-06', status: 'Baru', catatan: '' },
    { kode: 'REG-0003', nama: 'Putri Naela', nik: '3208024902010004', jk: 'P', lahir: '2001-02-09', kota: 'Kuningan',
      telepon: '0838-7714-2065', email: 'putrinae1@gmail.com', pendidikan: 'S1',
      program: 'MGN', bidang: 'Perawat',
      motivasi: 'Saya lulusan keperawatan dan ingin bekerja sebagai perawat lansia di Jepang karena kebutuhannya besar dan saya senang merawat orang.',
      tanggal: '2026-11-03', status: 'Diterima', catatan: 'Data lengkap dan sesuai. Sudah dihubungi lewat WhatsApp.' },
    { kode: 'REG-0002', nama: 'Farid Mattin', nik: '3208030512990007', jk: 'L', lahir: '1999-12-05', kota: 'Kuningan',
      telepon: '0812-9087-3351', email: 'xenoexploit99@yahoo.com', pendidikan: 'SMA / SMK / Sederajat',
      program: 'KRY', bidang: '',
      motivasi: 'Saya ingin mempersiapkan diri bekerja di Jepang sebagai karyawan, dan memulai dari belajar bahasa serta etos kerjanya.',
      tanggal: '2026-10-30', status: 'Diterima', catatan: 'Sudah datang ke kantor, data cocok dengan KTP.' },
    { kode: 'REG-0001', nama: 'Faris Abiyyushidqi', nik: '3329047004010002', jk: 'P', lahir: '2003-04-30', kota: 'Brebes',
      telepon: '0877-4402-6618', email: 'abiyyu54@gmail.com', pendidikan: 'SMA / SMK / Sederajat',
      program: 'MGN', bidang: '',
      motivasi: 'Ingin bekerja di Jepang supaya bisa menabung dan membuka usaha sendiri di kampung.',
      tanggal: '2026-10-27', status: 'Ditolak', catatan: 'Tahun lahir pada NIK tidak sama dengan data pendaftaran dan nomor tidak aktif saat dihubungi.' }
  ],

  statistik: [
    { bulan: 'Jun', n: 8 }, { bulan: 'Jul', n: 14 }, { bulan: 'Agu', n: 11 },
    { bulan: 'Sep', n: 19 }, { bulan: 'Okt', n: 16 }, { bulan: 'Nov', n: 9 }
  ],

  absensi: {} // diisi sensei: { 'K-N5A|2026-11-11': { 'S-001': 'Hadir', ... } }
};

/* Data berkas dibuat otomatis: setiap siswa punya 6 dokumen */
(function buatBerkas() {
  const polaS1 = ['Disetujui', 'Disetujui', 'Menunggu', 'Ditolak', 'Belum upload', 'Disetujui'];
  const acak = ['Disetujui', 'Disetujui', 'Menunggu', 'Belum upload', 'Ditolak'];
  let no = 1;
  DB.siswa.forEach((s, i) => {
    DOKUMEN.forEach((d, j) => {
      const status = i === 0 ? polaS1[j] : (s.tahap >= 3 ? 'Disetujui' : acak[(i * 3 + j) % 5]);
      const ada = status !== 'Belum upload';
      DB.berkas.push({
        id: 'BK-' + String(no++).padStart(3, '0'),
        siswa: s.id,
        dokumen: d,
        file: ada ? d.toLowerCase().replace(' ', '-') + '-' + s.id.toLowerCase() + '.pdf' : '',
        tanggal: ada ? '2026-10-' + String(5 + ((i + j) % 20)).padStart(2, '0') : '',
        status,
        catatan: status === 'Ditolak' ? 'Dokumen kurang jelas, mohon unggah ulang.' : ''
      });
    });
  });
})();
