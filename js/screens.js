/* =========================================================
   DETEKTIF ALGORITMA — screens.js
   Navigasi layar + isi layar: Cover, Welcome, Login, Peta Misi,
   Hasil Akhir. (Misi 1-3 ada di play.js, Sertifikat di certificate.js)
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var $ = DA.UI.$, el = DA.UI.el, wait = DA.UI.wait;
  var CFG = DA.CONFIG;

  /* =========================================================
     NAVIGASI
     ========================================================= */
  var hooks = {};
  var Nav = {
    current: null,
    register: function (name, h) { hooks[name] = h; },
    go: function (name, opts) {
      var next = $('screen-' + name);
      if (!next) return;
      var prevName = Nav.current;
      if (prevName && prevName !== name) {
        $('screen-' + prevName).classList.remove('active');
        if (hooks[prevName] && hooks[prevName].leave) hooks[prevName].leave();
      }
      DA.UI.closeModal();
      Nav.current = name;
      document.body.dataset.screen = name;
      next.classList.add('active');
      next.scrollTop = 0;
      if (hooks[name] && hooks[name].enter) hooks[name].enter(opts || {});
      DA.State.get().lastScreen = name;
    }
  };
  DA.Nav = Nav;

  /* kontrol suara global */
  function bindSound() {
    var buttons = [$('cover-sound'), $('hud-sound'), $('play-sound')];
    DA.Audio.onChange(function (on) {
      buttons.forEach(function (b) { if (b) { b.classList.toggle('muted', !on); b.setAttribute('aria-pressed', String(on)); } });
      var h = $('hud-sound'); if (h) h.textContent = on ? '🔊' : '🔇';
      var p = $('play-sound'); if (p) p.textContent = on ? '🔊' : '🔇';
    });
    buttons.forEach(function (b) {
      if (!b) return;
      b.addEventListener('click', function () { DA.Audio.unlock(); DA.Audio.toggle(); });
    });
  }

  /* =========================================================
     1. COVER
     ========================================================= */
  Nav.register('cover', {
    enter: function () { /* tombol sudah terpasang */ }
  });

  function bindCover() {
    $('cover-guide').addEventListener('click', function () { DA.Audio.play('click'); showGuide(); });
    $('cover-id').addEventListener('click', function () { DA.Audio.play('click'); showIdentity(); });
    $('cover-start').addEventListener('click', function () {
      DA.Audio.unlock(); DA.Audio.play('unlock');
      Nav.go('welcome');
    });
  }

  function showGuide() {
    DA.UI.modal({
      title: '📖 PANDUAN', who: 'kiko', wide: true,
      lines: [
        '1. Kartu arah ⬆ ⬇ ⬅ ➡ adalah perintah. Satu kartu = satu langkah Kiko.',
        '2. Susun kartu menjadi kode dengan menyeret (atau mengetuk) kartu ke slot kode.',
        '3. Misi 1: susun kartu acak lalu tekan CEK KODE.',
        '4. Misi 2: tekan JALANKAN dan amati jejak langkah Kiko.',
        '5. Misi 3: susun kode BARU yang berbeda, tetapi tetap sampai ke tujuan.',
        'Kiko tidak boleh menembus pagar tanaman. Jangan khawatir bila salah, kamu boleh mencoba lagi!'
      ],
      buttons: [{ label: 'MENGERTI!', cls: 'yellow' }]
    });
  }

  function showIdentity() {
    var d = CFG.developer;
    DA.UI.modal({
      title: '🪪 IDENTITAS', who: 'rima', wide: true,
      lines: [
        'Gim: ' + d.game,
        'Mata pelajaran: ' + d.topic,
        'Pengembang: ' + d.name,
        'Satuan pendidikan: ' + d.school
      ],
      buttons: [{ label: 'TUTUP', cls: 'blue' }]
    });
  }

  /* =========================================================
     2. WELCOME — dialog dibuat sebagai elemen HTML
     ========================================================= */
  var wlcToken = 0;
  var WELCOME = [
    { who: 'ARGA', side: 'left', text: 'Selamat datang di Taman Labirin!' },
    { who: 'RIMA', side: 'right', text: 'Ada tantangan algoritma yang menunggu kita.' },
    { who: 'KIKO', side: 'down', text: 'Bantu aku menyusun langkah, menjalankan kode, dan menemukan jalan!' }
  ];

  Nav.register('welcome', {
    enter: function () {
      var my = ++wlcToken, i = 0;
      var bub = $('wlc-bubble'), txt = $('wlc-text'), who = $('wlc-who');
      async function show() {
        if (my !== wlcToken) return;
        var L = WELCOME[i];
        $('screen-welcome').dataset.speaker = L.who.toLowerCase();
        bub.className = 'bubble show side-' + L.side + ' who-' + L.who.toLowerCase();
        who.textContent = L.who;
        await DA.UI.typeText(txt, L.text, 30);
        if (my !== wlcToken) return;
        await wait(1500);
        if (my !== wlcToken) return;
        if (i < WELCOME.length - 1) { i++; show(); }
      }
      bub.onclick = function () {
        if (txt._skipType) txt._skipType();
        else if (i < WELCOME.length - 1) { i++; show(); }
      };
      $('screen-welcome').dataset.speaker = '';
      bub.classList.remove('show');
      setTimeout(show, 450);
    },
    leave: function () { wlcToken++; }
  });

  /* =========================================================
     3. LOGIN PEMAIN
     ========================================================= */
  function bindLogin() {
    var sel = $('in-class');
    CFG.classes.forEach(function (c) { var o = el('option', null, c); o.value = c; sel.appendChild(o); });

    function submit() {
      var name = $('in-name').value.replace(/\s+/g, ' ').trim();
      var kelas = $('in-class').value;
      var sekolah = $('in-school').value.replace(/\s+/g, ' ').trim();
      var err = null, field = null;
      if (name.length < 2) { err = 'Nama wajib diisi ya!'; field = 'in-name'; }
      else if (!kelas) { err = 'Pilih kelasmu dulu ya!'; field = 'in-class'; }
      else if (sekolah.length < 3) { err = 'Nama sekolah wajib diisi ya!'; field = 'in-school'; }
      ['in-name', 'in-class', 'in-school'].forEach(function (id) { $(id).classList.remove('invalid'); });
      var msg = $('login-err');
      if (err) {
        msg.textContent = '⚠ ' + err;
        msg.classList.add('show');
        var f = $(field); f.classList.add('invalid'); f.focus();
        f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        DA.Audio.play('wrong');
        return;
      }
      msg.classList.remove('show');
      DA.State.setPlayer({ name: name.slice(0, 30), kelas: kelas, sekolah: sekolah.slice(0, 40) });
      DA.Audio.play('unlock');
      Nav.go('map');
    }
    $('login-start').addEventListener('click', submit);
    $('login-form').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    ['in-name', 'in-class', 'in-school'].forEach(function (id) {
      $(id).addEventListener('input', function () { $(id).classList.remove('invalid'); $('login-err').classList.remove('show'); });
    });
    $('login-back').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('welcome'); });
    $('wlc-back').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('cover'); });
    $('wlc-next').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('login'); });
  }

  Nav.register('login', {
    enter: function () {
      var p = DA.State.get().player;
      if (p) { $('in-name').value = p.name; $('in-class').value = p.kelas; $('in-school').value = p.sekolah; }
      $('login-err').classList.remove('show');
    }
  });

  /* =========================================================
     4. PETA MISI
     ========================================================= */
  function renderMap() {
    var st = DA.State.get();
    [1, 2, 3].forEach(function (n) {
      var b = $('hot-m' + n), m = st.missions[n];
      var locked = !DA.State.isUnlocked(n);
      b.classList.toggle('locked', locked);
      b.classList.toggle('done', !!m.done);
      b.classList.toggle('available', !locked && !m.done);
      b.setAttribute('aria-disabled', String(locked));
      var stars = b.querySelector('.hot-stars');
      stars.textContent = m.done ? '★'.repeat(m.stars) + '☆'.repeat(3 - m.stars) : '';
      b.setAttribute('aria-label', 'Misi ' + n + ' ' + CFG.missions[n].title + (locked ? ' terkunci' : m.done ? ' selesai' : ' tersedia'));
    });
    $('map-hud').textContent = '⭐ ' + DA.Score.stars() + '/9   🏆 ' + DA.Score.total();
    $('map-progress-fill').style.width = (DA.Score.progress() / 3 * 100) + '%';
    $('map-progress-label').textContent = DA.Score.progress() + '/3 misi';
    $('map-result').hidden = !DA.State.allDone();
  }

  function bindMap() {
    [1, 2, 3].forEach(function (n) {
      $('hot-m' + n).addEventListener('click', function () {
        if (!DA.State.isUnlocked(n)) {
          DA.Audio.play('wrong');
          var b = $('hot-m' + n);
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          DA.UI.toast('🔒 Selesaikan Misi ' + (n - 1) + ' dulu ya!');
          return;
        }
        DA.Audio.play('click');
        Nav.go('play', { n: n });
      });
    });
    $('map-back').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('login'); });
    $('map-result').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('result'); });
  }

  Nav.register('map', {
    enter: function () {
      renderMap();
      var st = DA.State.get();
      if (!Nav._greeted && st.player) {
        Nav._greeted = true;
        DA.UI.toast('Halo, Detektif ' + st.player.name + '! Pilih misi yang menyala ✨');
      }
    }
  });

  Nav.register('play', {
    enter: function (o) { DA.Play.open(o.n || 1); },
    leave: function () { DA.Play.leave(); }
  });

  /* =========================================================
     8. HASIL AKHIR
     ========================================================= */
  function renderResult() {
    var st = DA.State.get(), p = st.player || { name: '-', kelas: '-', sekolah: '-' };
    $('res-name').textContent = p.name;
    $('res-class').textContent = p.kelas;
    $('res-school').textContent = p.sekolah;
    $('res-score').textContent = DA.Score.total();
    $('res-score-max').textContent = '/ ' + DA.Score.MAX_TOTAL;
    var totalStars = DA.Score.stars();
    var row = $('res-stars'); row.innerHTML = '';
    for (var i = 0; i < 9; i++) {
      var s = el('span', 'star' + (i < totalStars ? ' on' : ''), '★');
      s.style.animationDelay = (0.3 + i * 0.12) + 's';
      row.appendChild(s);
    }
    $('res-stars-label').textContent = totalStars + ' dari 9 bintang';
    var ml = $('res-missions'); ml.innerHTML = '';
    [1, 2, 3].forEach(function (n) {
      var m = st.missions[n];
      var li = el('li', m.done ? 'done' : '');
      li.appendChild(el('span', 'chk', m.done ? '✔' : '○'));
      li.appendChild(el('span', 'nm', 'Misi ' + n + ' — ' + CFG.missions[n].title));
      li.appendChild(el('span', 'st', '★'.repeat(m.stars) + '☆'.repeat(3 - m.stars)));
      li.appendChild(el('b', 'pt', String(m.score)));
      ml.appendChild(li);
    });
    var bl = $('res-badges'); bl.innerHTML = '';
    DA.Score.badges().forEach(function (b) {
      var d = el('div', 'badge' + (b.id === 'final' ? ' final' : ''));
      d.appendChild(el('span', 'bi', b.id === 'final' ? '🕵️' : b.id === 1 ? '🔢' : b.id === 2 ? '🐾' : '🧭'));
      d.appendChild(el('span', 'bt', b.label));
      bl.appendChild(d);
    });
    $('res-title').textContent = DA.State.allDone() ? 'HASIL AKHIR' : 'PENCAPAIAN';
    $('res-cert').hidden = !DA.State.allDone();
  }

  function bindResult() {
    $('res-cert').addEventListener('click', function () { DA.Audio.play('click'); DA.UI.stopConfetti(); Nav.go('cert'); });
    $('res-map').addEventListener('click', function () { DA.Audio.play('click'); DA.UI.stopConfetti(); Nav.go('map'); });
    $('res-again').addEventListener('click', function () {
      DA.Audio.play('click');
      DA.UI.modal({
        title: 'MAIN LAGI?', who: 'kiko', tone: 'warn',
        text: 'Mulai sesi baru?',
        lines: ['Semua progress, skor, bintang, dan identitas pemain sebelumnya akan dihapus.'],
        buttons: [
          { label: 'YA, MULAI BARU', cls: 'pink', onClick: function () { newSession(); } },
          { label: 'BATAL', cls: 'blue' }
        ]
      });
    });
  }

  function newSession() {
    DA.UI.stopConfetti();
    DA.State.reset();
    Nav._greeted = false;
    ['in-name', 'in-school'].forEach(function (id) { $(id).value = ''; });
    $('in-class').value = '';
    DA.Play.resetSession();
    DA.Nav.go('cover');
    DA.UI.toast('Sesi baru dimulai. Selamat bermain!');
  }
  DA.newSession = newSession;

  Nav.register('result', {
    enter: function () {
      if (DA.State.allDone() && !DA.State.get().finishedAt) DA.State.set({ finishedAt: new Date().toISOString() });
      renderResult();
      if (DA.State.allDone()) { DA.Audio.play('success'); DA.UI.confetti(5000); }
    },
    leave: function () { DA.UI.stopConfetti(); }
  });

  Nav.register('cert', {
    enter: function () { DA.Cert.render(); },
    leave: function () { }
  });

  function bindCert() {
    $('cert-print').addEventListener('click', function () { DA.Audio.play('click'); DA.Cert.print(); });
    $('cert-back').addEventListener('click', function () { DA.Audio.play('click'); Nav.go('result'); });
  }

  /* =========================================================
     INISIALISASI SEMUA LAYAR
     ========================================================= */
  DA.initScreens = function () {
    bindSound(); bindCover(); bindLogin(); bindMap(); bindResult(); bindCert();
  };
})();
