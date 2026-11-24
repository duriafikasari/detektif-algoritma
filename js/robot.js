/* =========================================================
   DETEKTIF ALGORITMA — robot.js
   Animasi Kiko. Kiko SELALU dipindahkan berdasarkan koordinat petak
   dari mesin grid (bukan animasi bebas).
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var W = DA.CONFIG.art.w, H = DA.CONFIG.art.h;

  var arena, el, img, trail, fx, bubble, dotsLayer;
  var cur = { l: 0, t: 0 };
  var bubbleTimer = null;

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function init() {
    arena = document.getElementById('arena');
    el = document.getElementById('kiko');
    img = el.querySelector('.kiko-img');
    bubble = document.getElementById('kiko-bubble');
    trail = document.getElementById('arena-trail');
    fx = document.getElementById('arena-fx');
  }

  function setPos(cell) {
    cur.l = cell.x / W * 100;
    cur.t = cell.y / H * 100;
    el.style.left = cur.l + '%';
    el.style.top = cur.t + '%';
  }

  /** Taruh Kiko di tengah petak tanpa animasi. */
  function place(cell) {
    el.style.transition = 'none';
    el.classList.remove('cheer', 'sad', 'bonk', 'hop');
    setPos(cell);
    void el.offsetWidth;
    el.style.transition = '';
    hideBubble();
  }

  /** Pindah satu petak (animasi geser + lompat kecil). */
  function moveTo(cell, ms) {
    el.style.setProperty('--mv', ms + 'ms');
    img.style.setProperty('--hop', ms + 'ms');
    el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop');
    setPos(cell);
    return wait(ms);
  }

  /** Menabrak pagar: maju sedikit lalu kembali + goyang. */
  function bump(dir, ms) {
    var dx = { L: -2.4, R: 2.4, U: 0, D: 0 }[dir] || 0;
    var dy = { U: -4.6, D: 4.6, L: 0, R: 0 }[dir] || 0;
    var l0 = cur.l, t0 = cur.t;
    el.style.setProperty('--mv', (ms * 0.35) + 'ms');
    el.style.left = (l0 + dx) + '%';
    el.style.top = (t0 + dy) + '%';
    return wait(ms * 0.38).then(function () {
      el.classList.add('bonk');
      say('💫', 1400);
      el.style.setProperty('--mv', (ms * 0.45) + 'ms');
      el.style.left = l0 + '%';
      el.style.top = t0 + '%';
      return wait(ms * 0.5);
    }).then(function () { el.classList.remove('bonk'); });
  }

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    if (ms) bubbleTimer = setTimeout(hideBubble, ms);
  }
  function hideBubble() { clearTimeout(bubbleTimer); if (bubble) bubble.classList.remove('show'); }

  function cheer() { el.classList.remove('sad', 'bonk'); el.classList.add('cheer'); }
  function sad() { el.classList.remove('cheer'); el.classList.add('sad'); }
  function calm() { el.classList.remove('cheer', 'sad', 'bonk'); }

  /* ---------- jejak langkah ---------- */
  function clearTrail() { trail.innerHTML = ''; }
  function addDot(cell, n) {
    var d = document.createElement('div');
    d.className = 'step-dot';
    d.textContent = n;
    d.style.left = (cell.x / W * 100) + '%';
    d.style.top = (cell.y / H * 100) + '%';
    trail.appendChild(d);
  }

  /* ---------- ledakan bintang di petak ---------- */
  function burst(cell, emojis) {
    emojis = emojis || ['⭐', '✨', '🌟', '💛'];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.className = 'burst';
      s.textContent = emojis[i % emojis.length];
      s.style.left = (cell.x / W * 100) + '%';
      s.style.top = (cell.y / H * 100) + '%';
      var ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      var dist = 5 + Math.random() * 6;
      s.style.setProperty('--dx', (Math.cos(ang) * dist * 1.5) + 'cqw');
      s.style.setProperty('--dy', (Math.sin(ang) * dist) + 'cqw');
      fx.appendChild(s);
      (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1500); })(s);
    }
  }

  DA.Robot = {
    init: init, place: place, moveTo: moveTo, bump: bump, say: say, hideBubble: hideBubble,
    cheer: cheer, sad: sad, calm: calm, clearTrail: clearTrail, addDot: addDot, burst: burst
  };
})();
