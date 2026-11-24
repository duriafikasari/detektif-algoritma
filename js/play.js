/* =========================================================
   DETEKTIF ALGORITMA — play.js
   Pengendali Misi 1, 2, dan 3.
   SATU mekanik: KARTU ARAH → SUSUN KODE → JALANKAN → ROBOT BERGERAK.
   Ketiga misi memakai arena, Kiko, dan DA.Engine yang sama;
   yang berbeda hanya kondisi & tugas.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var $ = DA.UI.$, wait = DA.UI.wait, pick = DA.UI.pick;
  var E = DA.Engine, CFG = DA.CONFIG;

  var maze, solution, builder;
  var mission = 0, running = false, token = 0, attempts = 0, speedKey = 'normal';
  var seenIntro = {};
  var els = {};

  /* ---------- kalimat karakter ---------- */
  var SAY = {
    wallSoft: ['Coba periksa lagi arah panahmu.', 'Sepertinya Kiko menabrak pagar tanaman. Yuk, periksa lagi!', 'Hmm, ada arah yang kurang tepat. Kamu pasti bisa!'],
    short: ['Kiko berhenti sebelum sampai bendera. Yuk, telusuri urutan perintahnya!', 'Sepertinya Kiko menemui jalan buntu. Coba lagi ya!'],
    win1: ['Hebat! Urutan perintahmu benar!', 'Kerja bagus, Detektif! Kiko berhasil sampai tujuan!'],
    win2: ['Kiko berhasil sampai tujuan!', 'Lihat jejaknya! Satu kartu, satu langkah.'],
    win3: ['Wah, kamu menemukan jalur berbeda!', 'Keren! Algoritma barumu juga berhasil!']
  };

  function cacheEls() {
    ['play-back', 'play-num', 'play-title', 'play-score', 'coach-img', 'coach-text', 'code-count', 'code-title',
      'slots', 'pool', 'cards-board', 'cards-title', 'btn-reset', 'btn-check', 'btn-run', 'btn-route', 'btn-speed',
      'run-progress', 'run-fill', 'run-label', 'code-note', 'arena', 'pool-zone', 'play-mission-hint'].forEach(function (id) {
      els[id] = $(id);
    });
  }

  function init() {
    cacheEls();
    maze = E.createMaze(CFG.maze);
    solution = E.solve(maze);
    DA.maze = maze; DA.solution = solution;
    DA.Robot.init();

    builder = new DA.Cards.Builder({
      slotsEl: els.slots, poolEl: els.pool, zoneEl: els['pool-zone'],
      onChange: onBuilderChange
    });

    els['play-back'].addEventListener('click', function () { DA.Audio.play('click'); leave(); DA.Nav.go('map'); });
    els['btn-reset'].addEventListener('click', function () { DA.Audio.play('click'); reset(); });
    els['btn-check'].addEventListener('click', function () { DA.Audio.play('click'); checkM1(); });
    els['btn-run'].addEventListener('click', function () { DA.Audio.play('click'); run(); });
    els['btn-route'].addEventListener('click', function () { DA.Audio.play('click'); checkRoute(); });
    els['btn-speed'].addEventListener('click', function () {
      speedKey = speedKey === 'normal' ? 'fast' : speedKey === 'fast' ? 'slow' : 'normal';
      DA.Audio.play('click'); updateSpeed();
    });
    updateSpeed();
  }

  function updateSpeed() {
    var lab = { slow: '🐢 SANTAI', normal: '🚶 NORMAL', fast: '🐇 CEPAT' }[speedKey];
    els['btn-speed'].textContent = lab;
  }

  /* ---------- coach (karakter memberi feedback) ---------- */
  function coach(who, text) {
    els['coach-img'].src = 'assets/' + who + '.webp';
    els['coach-img'].dataset.who = who;
    var t = els['coach-text'];
    t.textContent = text;
    t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
  }

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function validShuffle(arr) {
    if (!Array.isArray(arr) || arr.length !== solution.length) return false;
    return arr.slice().sort().join('') === solution.slice().sort().join('');
  }

  /* ---------- membuka misi ---------- */
  function open(n) {
    var st = DA.State.get();
    if (n > 1 && !DA.State.isUnlocked(n)) { DA.UI.toast('Selesaikan misi sebelumnya dulu ya!'); DA.Nav.go('map'); return; }
    if (n === 2 && !(st.code1 && st.code1.length)) { DA.UI.toast('Selesaikan Misi 1 dulu ya!'); return open(1); }

    token++; running = false; attempts = 0; mission = n;
    var m = CFG.missions[n];
    els['play-num'].textContent = n;
    els['play-title'].textContent = m.title;
    els['play-mission-hint'].textContent = m.goal;
    document.getElementById('screen-play').dataset.mission = n;

    DA.Robot.place(maze.start);
    DA.Robot.clearTrail();

    if (n === 1) {
      var order = validShuffle(st.m1Shuffle) ? st.m1Shuffle : null;
      if (!order) {
        do { order = shuffled(solution); } while (order.join('') === solution.join(''));
        DA.State.set({ m1Shuffle: order });
      }
      builder.setupPool(order);
      if (st.m1Draft) builder.restoreDraft(st.m1Draft);
      els['code-title'].textContent = 'KODE-MU';
      els['cards-title'].textContent = 'KARTU ARAH (acak)';
      els['code-note'].textContent = 'Seret kartu ke slot (atau ketuk kartu). Ketuk kartu di slot untuk melepasnya.';
    } else if (n === 2) {
      builder.setupReadonly(st.code1);
      els['code-title'].textContent = 'KODE DARI MISI 1';
      els['code-note'].textContent = '🔒 Kode terkunci. Tekan JALANKAN lalu amati jejak Kiko.';
    } else {
      builder.setupPalette(CFG.limits.m3Max, st.m3Draft || []);
      els['code-title'].textContent = 'KODE BARUMU';
      els['cards-title'].textContent = 'KARTU ARAH (bebas dipakai)';
      els['code-note'].textContent = 'Seret atau ketuk kartu arah. Kartu boleh dipakai berkali-kali.';
    }

    /* tampilkan tombol sesuai misi */
    els['btn-check'].hidden = n !== 1;
    els['btn-run'].hidden = n === 1;
    els['btn-route'].hidden = n !== 3;
    els['btn-speed'].hidden = n === 1;
    els['cards-board'].hidden = n === 2;
    els['run-progress'].hidden = n === 1;
    els['btn-run'].textContent = '▶ JALANKAN';
    setButtons(true);
    setProgress(0, builder.seq.length);
    onBuilderChange(builder.dirs());
    updateHud();

    var intro = {
      1: ['kiko', 'Kartu arah masih acak! Susun urutannya supaya aku sampai ke bendera TUJUAN.'],
      2: ['rima', 'Ini kode yang kamu susun. Tekan JALANKAN, lalu amati langkah Kiko!'],
      3: ['arga', 'Bisakah kamu menyusun urutan yang BERBEDA, tetapi Kiko tetap sampai ke tujuan?']
    }[n];
    coach(intro[0], intro[1]);

    if (!seenIntro[n]) {
      seenIntro[n] = true;
      var lines = [m.intro];
      DA.UI.modal({
        title: 'MISI ' + n + ' — ' + m.title, who: n === 2 ? 'rima' : n === 3 ? 'arga' : 'kiko',
        text: n === 3 ? 'TANTANGAN!' : 'TUGASMU', lines: lines, wide: true,
        buttons: [{ label: 'MULAI MISI ▶', cls: 'yellow' }]
      });
    }
  }

  function leave() {
    token++; running = false;
    DA.UI.closeModal();
    DA.Robot.hideBubble();
  }

  function updateHud() {
    els['play-score'].textContent = '⭐ ' + DA.Score.stars() + '/9   🏆 ' + DA.Score.total();
  }

  function setButtons(enabled) {
    ['btn-reset', 'btn-check', 'btn-run', 'btn-route', 'btn-speed', 'play-back'].forEach(function (id) {
      if (id === 'play-back') return; // KEMBALI tetap aktif; menghentikan eksekusi
      els[id].disabled = !enabled;
    });
  }

  function setProgress(i, total) {
    var pct = total ? Math.min(100, i / total * 100) : 0;
    els['run-fill'].style.width = pct + '%';
    els['run-label'].textContent = 'Langkah ' + i + ' / ' + total;
  }

  function onBuilderChange(dirs) {
    var n = dirs.length;
    if (mission === 1) {
      els['code-count'].textContent = 'Kartu tersusun: ' + n + ' / ' + builder.max;
      DA.State.set({ m1Draft: n ? dirs : null });
    } else if (mission === 2) {
      els['code-count'].textContent = 'Jumlah instruksi: ' + n;
    } else {
      els['code-count'].textContent = 'Jumlah instruksi: ' + n + ' (maks. ' + builder.max + ')';
      DA.State.set({ m3Draft: n ? dirs : null });
      if (!running) setProgress(0, n);
    }
  }

  /* ---------- reset ---------- */
  function reset() {
    token++; running = false;
    DA.Robot.place(maze.start);
    DA.Robot.clearTrail();
    builder.clearMarks();
    if (mission === 1) { builder.setLocked(false); builder.reset(); coach('kiko', 'Kartu dikembalikan. Susun lagi, ya!'); }
    else if (mission === 3) { builder.setLocked(false); builder.reset(); coach('kiko', 'Kodenya dikosongkan. Ayo cari rute baru!'); }
    else { builder.setLocked(true); coach('kiko', 'Aku kembali ke titik MULAI. Siap dijalankan lagi!'); setProgress(0, builder.seq.length); }
    els['btn-run'].textContent = '▶ JALANKAN';
    setButtons(true);
    setProgress(0, builder.seq.length);
  }

  /* =========================================================
     MISI 1 — CEK KODE
     ========================================================= */
  function checkM1() {
    if (running || mission !== 1) return;
    var seq = builder.dirs();
    if (seq.length < builder.max) {
      var sisa = builder.max - seq.length;
      coach('rima', 'Pasang semua kartu ke slot dulu ya. Masih ada ' + sisa + ' kartu lagi!');
      DA.Audio.play('wrong');
      builder.shakeFull();
      return;
    }
    attempts++;
    var r = E.run(maze, seq);
    if (r.status === 'goal' && r.unused === 0) return winM1(seq, r);

    DA.Audio.play('wrong');
    DA.Robot.sad();
    setTimeout(DA.Robot.calm, 1400);
    DA.Robot.say('🤔', 1600);
    if (r.status === 'wall') {
      if (attempts === 1) coach('rima', pick(SAY.wallSoft));
      else {
        coach('rima', 'Kartu ke-' + (r.failIndex + 1) + ' membuat Kiko menabrak pagar. Coba ganti urutannya!');
        builder.flash(r.failIndex);
      }
    } else {
      coach('arga', pick(SAY.short));
      if (attempts >= 3) {
        var mm = E.firstMismatch(seq, solution);
        if (mm >= 0) { builder.flash(mm); coach('arga', 'Periksa kartu ke-' + (mm + 1) + ' dan sekitarnya. Kiko berhenti sebelum sampai bendera.'); }
      }
    }
  }

  function winM1(seq, r) {
    builder.setLocked(true);
    builder.markAllOk();
    DA.Audio.play('correct');
    DA.Robot.cheer();
    DA.Robot.burst(maze.start);
    var route = r.path.map(function (p) { return [p.c, p.r]; });
    DA.State.set({ code1: seq.slice(), route1: route, m1Draft: null });
    var res = DA.Score.apply(1, attempts);
    updateHud();
    var msg = pick(SAY.win1);
    coach('arga', msg);
    setTimeout(function () { DA.Audio.play('success'); DA.UI.confetti(2600); }, 350);
    setTimeout(function () {
      DA.UI.modal({
        title: '🎉 MISI 1 SELESAI!', who: 'arga', text: msg, tone: 'win', stars: res.stars,
        parts: res.parts, total: res.score,
        lines: ['Kodemu disimpan sebagai kode acuan. Misi 2 sekarang terbuka!'],
        buttons: [
          { label: 'LANJUT ▶', cls: 'yellow', onClick: function () { DA.UI.stopConfetti(); open(2); } },
          { label: 'PETA MISI', cls: 'blue', onClick: function () { DA.UI.stopConfetti(); DA.Nav.go('map'); } }
        ]
      });
    }, 900);
  }

  /* =========================================================
     MISI 2 & 3 — JALANKAN
     ========================================================= */
  async function run() {
    if (running || mission === 1) return;
    var seq = builder.dirs();
    if (!seq.length) { coach('rima', 'Susun kartu arah dulu ya, baru dijalankan!'); DA.Audio.play('wrong'); builder.shakeFull(); return; }

    running = true; var my = ++token;
    attempts++;
    setButtons(false);
    builder.setLocked(true);
    builder.clearMarks();
    DA.Robot.place(maze.start);
    DA.Robot.clearTrail();
    setProgress(0, seq.length);
    coach('kiko', 'Aku mulai berjalan, ya! Perhatikan langkahku.');

    var r = E.run(maze, seq);                    // mesin grid yang sama untuk semua misi
    var ms = CFG.speeds[speedKey];
    var moveMs = Math.round(ms * 0.55), gapMs = ms - moveMs;
    await wait(350);

    for (var k = 0; k < r.moves.length; k++) {
      if (my !== token) return;                  // dibatalkan (RESET / KEMBALI)
      var mv = r.moves[k];
      builder.setActive(mv.i);
      setProgress(k + 1, seq.length);
      if (mv.ok) {
        DA.Audio.play('step');
        await DA.Robot.moveTo(mv.to, moveMs);
        if (my !== token) return;
        DA.Robot.addDot(mv.to, k + 1);
        await wait(gapMs);
      } else {
        DA.Audio.play('bump');
        await DA.Robot.bump(mv.dir, moveMs * 1.6);
        builder.markError(mv.i);
      }
    }
    if (my !== token) return;
    builder.finishActive();
    running = false;
    evaluateRun(r, seq);
  }

  function endRun(canEdit) {
    setButtons(true);
    builder.setLocked(!canEdit);
    els['btn-run'].textContent = '↻ ULANGI';
  }

  function evaluateRun(r, seq) {
    if (mission === 2) return evalM2(r, seq);
    return evalM3(r, seq);
  }

  /* ----- Misi 2: uji kode ----- */
  function evalM2(r, seq) {
    if (r.status === 'goal') {
      DA.Robot.cheer(); DA.Robot.burst(maze.goal); DA.Audio.play('success');
      DA.UI.confetti(2200);
      var res = DA.Score.apply(2, attempts);
      DA.State.set({ m2Success: true });
      updateHud();
      var msg = pick(SAY.win2);
      coach('rima', msg);
      endRun(false);
      setTimeout(function () {
        DA.UI.modal({
          title: '🐾 MISI 2 SELESAI!', who: 'rima', text: msg, tone: 'win', stars: res.stars,
          parts: res.parts, total: res.score,
          lines: ['Kamu melihat sendiri: setiap kartu membuat Kiko melangkah satu petak, berurutan. Itulah algoritma! Misi 3 terbuka.'],
          buttons: [
            { label: 'LANJUT ▶', cls: 'yellow', onClick: function () { DA.UI.stopConfetti(); open(3); } },
            { label: 'PETA MISI', cls: 'blue', onClick: function () { DA.UI.stopConfetti(); DA.Nav.go('map'); } }
          ]
        });
      }, 1100);
    } else {
      // Tidak seharusnya terjadi (kode Misi 1 sudah benar), tetapi ditangani dengan aman.
      DA.Robot.sad(); DA.Audio.play('wrong'); endRun(false);
      coach('arga', 'Yuk, telusuri urutan perintahnya! Mungkin kodenya perlu diperbaiki di Misi 1.');
      DA.UI.modal({
        title: 'KIKO BELUM SAMPAI', who: 'arga', text: 'Kode ini belum membawa Kiko ke tujuan. Kamu bisa memperbaikinya di Misi 1.',
        buttons: [{ label: 'KE MISI 1', cls: 'yellow', onClick: function () { open(1); } }, { label: 'COBA LAGI', cls: 'blue' }]
      });
    }
  }

  /* ----- Misi 3: rute alternatif ----- */
  function baseCells() {
    var base = DA.State.get().code1 || solution;
    var set = {};
    E.run(maze, base).path.forEach(function (p) { set[p.c + ':' + p.r] = true; });
    return set;
  }
  /* Rute dianggap BERBEDA bila melewati setidaknya satu petak yang tidak dilalui rute Misi 1
     (artinya Kiko memilih lorong lain, bukan sekadar bolak-balik di jalur yang sama). */
  function isNewRoute(path) {
    var base = baseCells();
    return path.some(function (p) { return !base[p.c + ':' + p.r]; });
  }

  function evalM3(r, seq) {
    var same = r.status === 'goal' && !isNewRoute(r.path);
    if (r.status === 'goal' && !same) {
      DA.Robot.cheer(); DA.Robot.burst(maze.goal); DA.Audio.play('alt');
      setTimeout(function () { DA.Audio.play('success'); }, 400);
      DA.UI.confetti(2600);
      var used = seq.slice(0, r.moves.length);
      DA.State.set({ code3: used, route3: r.path.map(function (p) { return [p.c, p.r]; }), m3Draft: null });
      var res = DA.Score.apply(3, attempts);
      updateHud();
      var msg = pick(SAY.win3);
      coach('arga', msg);
      endRun(false);
      var lines = ['Misi 1 memakai ' + solution.length + ' langkah. Rutemu memakai ' + used.length + ' langkah dan berbeda. Itulah algoritma alternatif!'];
      if (r.unused > 0) lines.push('Catatan: ' + r.unused + ' kartu terakhir tidak terpakai karena Kiko sudah sampai.');
      setTimeout(function () {
        DA.UI.modal({
          title: '🌟 MISI 3 SELESAI!', who: 'rima', text: msg, tone: 'win', stars: res.stars,
          parts: res.parts, total: res.score, lines: lines,
          buttons: [
            { label: 'LIHAT HASIL ▶', cls: 'yellow', onClick: function () { DA.UI.stopConfetti(); DA.Nav.go('result'); } },
            { label: 'PETA MISI', cls: 'blue', onClick: function () { DA.UI.stopConfetti(); DA.Nav.go('map'); } }
          ]
        });
      }, 1200);
      return;
    }

    DA.Robot.sad(); DA.Audio.play('wrong');
    setTimeout(DA.Robot.calm, 1500);
    endRun(true);
    if (same) {
      DA.Robot.say('🤔', 1800);
      coach('arga', 'Kiko sampai, tetapi lewat jalur yang sama dengan Misi 1. Lihat peta: ada lorong lain menuju bendera. Coba lewat sana!');
    } else if (r.status === 'wall') {
      coach('rima', 'Kartu ke-' + (r.failIndex + 1) + ' membuat Kiko menabrak pagar. Ubah kartunya dan coba lagi!');
      builder.flash(r.failIndex);
    } else {
      coach('rima', 'Kiko berhenti sebelum sampai ke bendera. Tambahkan kartu agar Kiko tiba di tujuan!');
    }
  }

  /* CEK RUTE: uji tanpa animasi (tidak dihitung sebagai percobaan) */
  function checkRoute() {
    if (running || mission !== 3) return;
    var seq = builder.dirs();
    if (!seq.length) { coach('rima', 'Susun kartu arah dulu ya!'); DA.Audio.play('wrong'); builder.shakeFull(); return; }
    var r = E.run(maze, seq);
    var same = r.status === 'goal' && !isNewRoute(r.path);
    builder.clearMarks();
    if (r.status === 'wall') {
      coach('rima', 'Di kartu ke-' + (r.failIndex + 1) + ', Kiko akan menabrak pagar tanaman.');
      builder.flash(r.failIndex); DA.Audio.play('wrong');
    } else if (r.status !== 'goal') {
      coach('rima', 'Dengan kode ini Kiko berhenti sebelum sampai ke bendera.'); DA.Audio.play('wrong');
    } else if (same) {
      coach('arga', 'Kiko akan sampai, tetapi lewat jalur yang sama dengan Misi 1. Cari lorong lain menuju bendera!'); DA.Audio.play('wrong');
    } else {
      coach('arga', 'Rutemu sampai ke tujuan dan berbeda dari Misi 1! Tekan JALANKAN untuk membuktikannya.'); DA.Audio.play('correct');
    }
  }

  function resetSession() { seenIntro = {}; attempts = 0; token++; running = false; }

  DA.Play = { init: init, open: open, leave: leave, refreshHud: updateHud, resetSession: resetSession };
})();
