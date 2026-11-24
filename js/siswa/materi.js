/* siswa/materi.js — materi unduhan + mini flashcards & kuis kanji/kosakata interaktif */
(function () {
  const me = Store.get('siswa').find((s) => s.id === Auth.user().id);
  const kelasSaya = [me.kelas].concat(KELAS_UMUM);
  const materi = Store.get('materi').filter((m) => kelasSaya.includes(m.kelas))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id));

  /* ---------- 1. Modul Berkas Unduhan ---------- */
  $('#tblMateri tbody').innerHTML = materi.map((m) => `
    <tr data-id="${m.id}">
      <td><strong>${esc(m.judul)}</strong></td>
      <td>${esc(m.kelas)}</td>
      <td>${esc(m.jenis)}</td>
      <td>${esc(m.ukuran)}</td>
      <td>${Fmt.tanggal(m.tanggal)}</td>
      <td><div class="actions"><button class="btn btn-sm" data-unduh>${icon('download')} Unduh</button></div></td>
    </tr>`).join('');
  Table.refresh('#tblMateri');

  $('#tblMateri').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-unduh]'); if (!btn) return;
    const m = materi.find((x) => x.id === btn.closest('tr').dataset.id);
    UI.download(m.judul.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.txt',
      `${m.judul}\nKelas: ${m.kelas} · Jenis: ${m.jenis}\n\n(Berkas contoh. Pada sistem sebenarnya, di sinilah file materi diunduh.)\n`);
    UI.toast(`Mengunduh "${m.judul}"…`);
  });

  /* Auto switch tab dari URL parameter ?tab=flashcard */
  if (window.location.search.includes('tab=flashcard') || window.location.hash === '#flashcard') {
    const tabFc = $('[data-tab="flashcard"]');
    if (tabFc) tabFc.click();
  }

  /* ---------- 2. Mini Flashcard & Kuis Interaktif ---------- */
  const allCards = Store.get('flashcards') || [];
  let cards = [...allCards];
  let curIndex = 0;
  const stats = { paham: new Set(), belum: new Set() };

  const elCard = $('#fcCard');
  const elStage = $('#fcStage');
  const elFrontTag = $('#fcFrontTag');
  const elFrontKanji = $('#fcFrontKanji');
  const elFrontKana = $('#fcFrontKana');
  const elBackTag = $('#fcBackTag');
  const elBackArti = $('#fcBackArti');
  const elBackRomaji = $('#fcBackRomaji');
  const elBackExJp = $('#fcBackExJp');
  const elBackExId = $('#fcBackExId');
  const elCounter = $('#fcCounter');
  const elStats = $('#fcStats');
  const elProgressFill = $('#fcProgressFill');
  const selKategori = $('#filterFcKategori');

  function updateCardsByFilter() {
    const kat = selKategori ? selKategori.value : '';
    cards = kat ? allCards.filter((c) => c.kategori === kat) : [...allCards];
    curIndex = 0;
    renderCard();
  }

  function renderCard() {
    if (!cards.length) return;
    const item = cards[curIndex];
    if (elCard) elCard.classList.remove('flipped');

    if (elFrontTag) elFrontTag.textContent = item.kategori;
    if (elFrontKanji) elFrontKanji.textContent = item.kanji;
    if (elFrontKana) elFrontKana.textContent = item.kana;

    if (elBackTag) elBackTag.textContent = item.kategori;
    if (elBackArti) elBackArti.textContent = item.arti;
    if (elBackRomaji) elBackRomaji.textContent = 'Romaji: ' + item.romaji;
    if (elBackExJp) elBackExJp.textContent = item.contoh_jp || '';
    if (elBackExId) elBackExId.textContent = item.contoh_id || '';

    if (elCounter) elCounter.textContent = `Kartu ${curIndex + 1} dari ${cards.length}`;
    if (elStats) elStats.textContent = `Paham: ${stats.paham.size} · Ulang: ${stats.belum.size}`;
    if (elProgressFill) elProgressFill.style.width = Math.round(((curIndex + 1) / cards.length) * 100) + '%';
  }

  function flipCard() {
    if (elCard) elCard.classList.toggle('flipped');
  }

  function nextCard() {
    if (!cards.length) return;
    curIndex = (curIndex + 1) % cards.length;
    renderCard();
  }

  function prevCard() {
    if (!cards.length) return;
    curIndex = (curIndex - 1 + cards.length) % cards.length;
    renderCard();
  }

  function shuffleCards() {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    curIndex = 0;
    renderCard();
    UI.toast('Urutan kartu diacak 🔀');
  }

  if (elStage) elStage.addEventListener('click', flipCard);
  if ($('#btnFcFlip')) $('#btnFcFlip').addEventListener('click', flipCard);
  if ($('#btnFcNext')) $('#btnFcNext').addEventListener('click', nextCard);
  if ($('#btnFcPrev')) $('#btnFcPrev').addEventListener('click', prevCard);
  if ($('#btnFcShuffle')) $('#btnFcShuffle').addEventListener('click', shuffleCards);

  if ($('#btnFcPaham')) {
    $('#btnFcPaham').addEventListener('click', () => {
      const item = cards[curIndex];
      stats.paham.add(item.id);
      stats.belum.delete(item.id);
      UI.toast(`Sudah paham: "${item.kanji}" ✅`, 'ok');
      nextCard();
    });
  }

  if ($('#btnFcBelum')) {
    $('#btnFcBelum').addEventListener('click', () => {
      const item = cards[curIndex];
      stats.belum.add(item.id);
      stats.paham.delete(item.id);
      UI.toast(`Perlu diulang: "${item.kanji}"`, 'warn');
      nextCard();
    });
  }

  if (selKategori) selKategori.addEventListener('change', updateCardsByFilter);

  // Shortcut keyboard: Spasi = flip, Panah kanan = next, Panah kiri = prev
  document.addEventListener('keydown', (e) => {
    const tabFc = $('[data-panel="flashcard"]');
    if (!tabFc || tabFc.hidden) return;
    if ($('#viewFlashcard') && $('#viewFlashcard').style.display !== 'none') {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault(); flipCard();
      } else if (e.code === 'ArrowRight') {
        nextCard();
      } else if (e.code === 'ArrowLeft') {
        prevCard();
      }
    }
  });

  /* ---------- 3. Mode Mini Kuis ---------- */
  let quizQuestions = [];
  let quizIndex = 0;
  let quizScore = 0;

  const viewFc = $('#viewFlashcard');
  const viewQuiz = $('#viewQuiz');
  const btnModeKartu = $('#btnModeKartu');
  const btnModeKuis = $('#btnModeKuis');
  const quizBox = $('.quiz-box', viewQuiz);
  const quizResultBox = $('#quizResultBox');

  function setMode(mode) {
    if (mode === 'kuis') {
      btnModeKuis.className = 'btn btn-sm btn-primary';
      btnModeKartu.className = 'btn btn-sm btn-ghost';
      viewFc.style.display = 'none';
      viewQuiz.style.display = 'block';
      startQuiz();
    } else {
      btnModeKartu.className = 'btn btn-sm btn-primary';
      btnModeKuis.className = 'btn btn-sm btn-ghost';
      viewQuiz.style.display = 'none';
      viewFc.style.display = 'block';
    }
  }

  if (btnModeKartu) btnModeKartu.addEventListener('click', () => setMode('kartu'));
  if (btnModeKuis) btnModeKuis.addEventListener('click', () => setMode('kuis'));
  if ($('#btnQuizBackToCards')) $('#btnQuizBackToCards').addEventListener('click', () => setMode('kartu'));
  if ($('#btnQuizRestart')) $('#btnQuizRestart').addEventListener('click', startQuiz);

  function startQuiz() {
    quizBox.style.display = 'block';
    quizResultBox.style.display = 'none';
    quizScore = 0;
    quizIndex = 0;

    // Ambil 5 soal acak
    const pool = [...allCards].sort(() => 0.5 - Math.random());
    quizQuestions = pool.slice(0, 5).map((q) => {
      // 3 distraktor salah
      const others = allCards.filter((x) => x.id !== q.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [q.arti, ...others.map((o) => o.arti)].sort(() => 0.5 - Math.random());
      return { q, options, correct: q.arti };
    });

    renderQuizStep();
  }

  function renderQuizStep() {
    if (quizIndex >= quizQuestions.length) {
      finishQuiz();
      return;
    }
    const current = quizQuestions[quizIndex];
    $('#quizStepText').textContent = `Pertanyaan ${quizIndex + 1} dari ${quizQuestions.length}`;
    $('#quizScoreBadge').textContent = `Skor: ${quizScore}`;
    $('#quizQuestionKanji').textContent = current.q.kanji;
    $('#quizQuestionKana').textContent = `${current.q.kana} (${current.q.romaji})`;

    const feedback = $('#quizFeedback');
    feedback.className = 'quiz-feedback';
    feedback.textContent = '';
    $('#btnQuizNext').style.display = 'none';

    const optsContainer = $('#quizOptionsList');
    optsContainer.innerHTML = current.options.map((opt) => `
      <button type="button" class="quiz-opt-btn" data-val="${esc(opt)}">${esc(opt)}</button>
    `).join('');
  }

  $('#quizOptionsList').addEventListener('click', (e) => {
    const btn = e.target.closest('.quiz-opt-btn');
    if (!btn || btn.disabled) return;
    const current = quizQuestions[quizIndex];
    const picked = btn.dataset.val;
    const isCorrect = picked === current.correct;

    // Matikan semua tombol
    $$('.quiz-opt-btn', $('#quizOptionsList')).forEach((b) => {
      b.disabled = true;
      if (b.dataset.val === current.correct) b.classList.add('correct');
      else if (b === btn && !isCorrect) b.classList.add('wrong');
    });

    const feedback = $('#quizFeedback');
    feedback.classList.add('show');
    if (isCorrect) {
      quizScore += 20;
      $('#quizScoreBadge').textContent = `Skor: ${quizScore}`;
      feedback.classList.add('ok');
      feedback.innerHTML = `<strong>Tepat Sekali! 🎉</strong> ${current.q.kanji} (${current.q.kana}) berarti "<strong>${esc(current.correct)}</strong>".`;
    } else {
      feedback.classList.add('bad');
      feedback.innerHTML = `<strong>Belum Tepat! ❌</strong> ${current.q.kanji} (${current.q.kana}) yang benar adalah "<strong>${esc(current.correct)}</strong>".`;
    }

    const btnNext = $('#btnQuizNext');
    btnNext.style.display = 'inline-block';
    btnNext.textContent = quizIndex === quizQuestions.length - 1 ? 'Lihat Hasil Akhir 🏆' : 'Lanjut Soal Berikutnya →';
    btnNext.focus();
  });

  $('#btnQuizNext').addEventListener('click', () => {
    quizIndex++;
    renderQuizStep();
  });

  function finishQuiz() {
    quizBox.style.display = 'none';
    quizResultBox.style.display = 'block';
    $('#quizFinalScore').textContent = `${quizScore} / 100`;

    let msg = '';
    if (quizScore >= 80) msg = 'Luar biasa! Penguasaan kosakata kerja dan kanji Jepang kamu sudah sangat matang untuk ujian bulanan.';
    else if (quizScore >= 60) msg = 'Bagus! Cukup menguasai, namun luangkan waktu 10 menit lagi untuk mematangkan kosakata yang keliru.';
    else msg = 'Tetap semangat! Gunakan Mode Flashcard untuk menghafal kembali kosakata sebelum mencoba kuis ulang.';
    $('#quizSummaryText').textContent = msg;
  }

  renderCard();
})();
