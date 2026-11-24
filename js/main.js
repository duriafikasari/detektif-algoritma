/* =========================================================
   DETEKTIF ALGORITMA — main.js
   Titik masuk: menyiapkan semua modul lalu membuka layar pertama.
   ========================================================= */
(function () {
  'use strict';
  var DA = window.DA;

  function start() {
    DA.UI.fit();
    window.addEventListener('resize', DA.UI.fit);
    window.addEventListener('orientationchange', function () { setTimeout(DA.UI.fit, 150); });

    DA.initScreens();
    DA.Play.init();

    // Audio baru aktif setelah interaksi pertama (aturan autoplay browser)
    var first = function () {
      DA.Audio.unlock();
      window.removeEventListener('pointerdown', first, true);
      window.removeEventListener('keydown', first, true);
    };
    window.addEventListener('pointerdown', first, true);
    window.addEventListener('keydown', first, true);

    // Hindari gulir/zoom tak sengaja pada gestur seret
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

    // Pemain lama (refresh halaman) → lanjut dari Peta Misi
    if (DA.State.hasPlayer()) DA.Nav.go('map');
    else DA.Nav.go('cover');

    var hint = document.getElementById('rotate-hint-close');
    if (hint) hint.addEventListener('click', function () { document.body.classList.add('hide-rotate'); });

    // Sembunyikan layar muat
    var boot = document.getElementById('boot');
    if (boot) setTimeout(function () { boot.classList.add('gone'); }, 250);
  }

  // Pra-muat gambar utama agar transisi mulus
  var imgs = ['cover', 'welcome', 'login', 'peta', 'arena'].map(function (n) { return 'assets/' + n + '.jpg'; })
    .concat(['arga', 'rima', 'kiko'].map(function (n) { return 'assets/' + n + '.webp'; }));
  var left = imgs.length, started = false;
  function go() { if (started) return; started = true; start(); }
  imgs.forEach(function (src) {
    var i = new Image();
    i.onload = i.onerror = function () { if (--left <= 0) go(); };
    i.src = src;
  });
  setTimeout(go, 4000); // jangan menunggu terlalu lama bila ada gambar lambat
})();
