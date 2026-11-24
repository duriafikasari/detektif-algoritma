/* =========================================================
   DETEKTIF ALGORITMA — ui.js
   Utilitas UI: ukuran panggung, toast, modal, efek (konfeti), pengetik teks.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});

  function $(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  /* ---------- ukuran panggung 16:9 → variabel --u (1% lebar panggung) ---------- */
  function fit() {
    var w = Math.min(window.innerWidth, window.innerHeight * 16 / 9);
    document.documentElement.style.setProperty('--u', (w / 100) + 'px');
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    var portrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', portrait);
    document.body.classList.toggle('compact', w < 720);
    if (DA.Cert && DA.Cert.fit) DA.Cert.fit();
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
  }

  /* ---------- modal ---------- */
  var current = null;
  function closeModal() {
    if (!current) return;
    var m = current; current = null;
    m.classList.remove('show');
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 250);
  }

  /**
   * opts: {title, text, lines[], who, stars, parts[], total, buttons[], tone, wide}
   * buttons: [{label, cls, onClick}]
   */
  function modal(opts) {
    closeModal();
    var back = el('div', 'modal-back');
    var box = el('div', 'modal tone-' + (opts.tone || 'info') + (opts.wide ? ' wide' : ''));
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');

    if (opts.title) {
      var h = el('div', 'modal-title');
      h.appendChild(el('span', null, opts.title));
      box.appendChild(h);
    }
    var body = el('div', 'modal-body');
    if (opts.who) {
      var av = el('img', 'modal-avatar');
      av.src = 'assets/' + opts.who + '.webp';
      av.alt = opts.who;
      body.appendChild(av);
    }
    var tx = el('div', 'modal-text');
    if (opts.text) tx.appendChild(el('p', 'lead', opts.text));
    (opts.lines || []).forEach(function (l) { tx.appendChild(el('p', null, l)); });

    if (typeof opts.stars === 'number') {
      var st = el('div', 'stars-row');
      for (var i = 0; i < 3; i++) {
        var s = el('span', 'star' + (i < opts.stars ? ' on' : ''), '★');
        s.style.animationDelay = (0.25 + i * 0.28) + 's';
        st.appendChild(s);
      }
      tx.appendChild(st);
      if (opts.stars > 0) {
        for (var k = 0; k < opts.stars; k++) (function (kk) { setTimeout(function () { DA.Audio.play('star'); }, 300 + kk * 280); })(k);
      }
    }
    if (opts.parts && opts.parts.length) {
      var ul = el('ul', 'score-parts');
      opts.parts.forEach(function (p) {
        var li = el('li');
        li.appendChild(el('span', null, p.label));
        li.appendChild(el('b', null, '+' + p.pts));
        ul.appendChild(li);
      });
      if (opts.total != null) {
        var t = el('li', 'sum');
        t.appendChild(el('span', null, 'Skor total'));
        t.appendChild(el('b', null, String(opts.total)));
        ul.appendChild(t);
      }
      tx.appendChild(ul);
    }
    body.appendChild(tx);
    box.appendChild(body);

    var act = el('div', 'modal-actions');
    (opts.buttons || [{ label: 'OKE' }]).forEach(function (b) {
      var btn = el('button', 'btn ' + (b.cls || ''), b.label);
      btn.type = 'button';
      btn.addEventListener('click', function () {
        DA.Audio.play('click');
        if (b.keep !== true) closeModal();
        if (b.onClick) b.onClick();
      });
      act.appendChild(btn);
    });
    box.appendChild(act);
    back.appendChild(box);
    $('modal-root').appendChild(back);
    current = back;
    requestAnimationFrame(function () { back.classList.add('show'); });
    var first = act.querySelector('button');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    return { close: closeModal, el: box };
  }

  /* ---------- efek ---------- */
  var confettiRaf = null;
  function confetti(ms) {
    var cv = $('fx-canvas'), cx = cv.getContext('2d');
    var w = cv.width = window.innerWidth, h = cv.height = window.innerHeight;
    var colors = ['#ffc928', '#ff7eb6', '#3da5ff', '#5cd35c', '#ffffff', '#ff8a3d'];
    var P = [];
    for (var i = 0; i < 160; i++) {
      P.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.6,
        r: 5 + Math.random() * 7, c: colors[i % colors.length],
        vx: -1.5 + Math.random() * 3, vy: 2 + Math.random() * 4,
        rot: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, shape: i % 3
      });
    }
    var end = performance.now() + (ms || 4500);
    cancelAnimationFrame(confettiRaf);
    function frame(now) {
      cx.clearRect(0, 0, w, h);
      var alive = false;
      P.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.02;
        if (now < end && p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
        if (p.y < h + 30) alive = true;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c;
        if (p.shape === 0) cx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        else if (p.shape === 1) { cx.beginPath(); cx.arc(0, 0, p.r / 2, 0, 7); cx.fill(); }
        else { cx.beginPath(); cx.moveTo(0, -p.r / 2); cx.lineTo(p.r / 2, p.r / 2); cx.lineTo(-p.r / 2, p.r / 2); cx.fill(); }
        cx.restore();
      });
      if (alive && now < end + 3000) confettiRaf = requestAnimationFrame(frame);
      else cx.clearRect(0, 0, w, h);
    }
    confettiRaf = requestAnimationFrame(frame);
  }
  function stopConfetti() {
    cancelAnimationFrame(confettiRaf);
    var cv = $('fx-canvas');
    cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
  }

  /** Teks mengetik; mengembalikan fungsi untuk melewati animasi. */
  function typeText(target, text, speed) {
    var i = 0, done = false, timer;
    target.textContent = '';
    return new Promise(function (resolve) {
      function end() { if (done) return; done = true; clearInterval(timer); target.textContent = text; resolve(); }
      timer = setInterval(function () {
        i++; target.textContent = text.slice(0, i);
        if (i >= text.length) end();
      }, speed || 28);
      target._skipType = end;
    });
  }

  DA.UI = {
    $: $, el: el, wait: wait, pick: pick, fit: fit, toast: toast,
    modal: modal, closeModal: closeModal,
    confetti: confetti, stopConfetti: stopConfetti, typeText: typeText
  };
})();
