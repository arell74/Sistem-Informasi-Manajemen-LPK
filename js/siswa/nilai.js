/* siswa/nilai.js — nilai per komponen, rata-rata, riwayat ujian */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  const nilai = Store.get('nilai')[me.id];
  const ujian = Store.get('ujian').filter((u) => u.siswa === me.id);
  const LABEL = { kosakata: 'Kosakata (Goi)', kanji: 'Kanji', tata: 'Tata Bahasa (Bunpou)', listening: 'Listening (Choukai)', kaiwa: 'Kaiwa (Percakapan)' };
  const predikat = (r) => r >= 85 ? ['A', 'ok', 'Sangat baik'] : r >= 75 ? ['B', 'info', 'Baik'] : r >= 65 ? ['C', 'warn', 'Cukup'] : ['D', 'bad', 'Perlu ditingkatkan'];

  $('#kelasInfo').textContent = 'Kelas ' + me.kelas;

  if (!nilai) {
    $('#nilaiList').innerHTML = '<div class="empty">Nilai belum diinput oleh sensei.</div>';
  } else {
    const entri = Object.entries(nilai);
    const rata = Math.round(entri.reduce((t, [, v]) => t + v, 0) / entri.length);
    const [huruf, tone, ket] = predikat(rata);

    $('#nilaiList').innerHTML = entri.map(([k, v]) => `
      <div style="margin-bottom:1.1rem">
        <div style="display:flex;justify-content:space-between;font-size:.88rem;margin-bottom:.3rem"><span>${LABEL[k] || k}</span><b>${v}</b></div>
        <div class="progress ${v >= 75 ? 'ok' : v < 65 ? 'warn' : ''}"><i style="--v:${v}%"></i></div>
      </div>`).join('');

    $('#ring').style.setProperty('--p', rata);
    $('#ring b').textContent = rata;
    $('#predikat').innerHTML = `<span class="badge badge-${tone}" style="font-size:.9rem;padding:.3rem 1rem">Predikat ${huruf} · ${ket}</span>`;

    const terendah = entri.slice().sort((a, b) => a[1] - b[1])[0];
    $('#saran').textContent = `Fokus berikutnya: ${LABEL[terendah[0]]} (nilai ${terendah[1]}).`;
  }

  $('#ujian').innerHTML = ujian.length
    ? `<div class="bars" style="height:170px">${ujian.map((u) => `<div class="bar"><b>${u.skor}</b><i style="--h:${u.skor}%"></i><span>${esc(u.nama.replace('Ujian Bulanan ', ''))}</span></div>`).join('')}</div>
       <p class="muted text-sm mt" style="margin-bottom:0">Skor ujian bulanan dan simulasi tes (skala 0–100). Target kelulusan: 75 ke atas.</p>`
    : '<div class="empty">Belum ada riwayat ujian.</div>';
})();
