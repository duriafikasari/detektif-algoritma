/* =========================================================
   DETEKTIF ALGORITMA — cards.js
   Kartu perintah arah + papan penyusun kode dengan drag-and-drop.
   Memakai Pointer Events sehingga mouse, sentuh, dan pena
   bekerja dengan cara yang sama. Mendukung juga: ketuk untuk memasang.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});

  var NAME = { U: 'ATAS', D: 'BAWAH', L: 'KIRI', R: 'KANAN' };
  var ROT = { U: 0, R: 90, D: 180, L: 270 };
  var uid = 0;

  function arrowSVG(dir) {
    return '<svg class="arrow" viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(' + ROT[dir] +
      ' 50 50)"><path d="M50 9 L91 52 L67 52 L67 91 L33 91 L33 52 L9 52 Z"/></g></svg>';
  }

  function cardEl(card) {
    var d = document.createElement('div');
    d.className = 'card dir-' + card.dir;
    d.dataset.id = card.id;
    d.dataset.dir = card.dir;
    d.setAttribute('role', 'button');
    d.setAttribute('tabindex', '0');
    d.setAttribute('aria-label', 'Kartu ' + NAME[card.dir]);
    d.innerHTML = arrowSVG(card.dir) + '<span class="lbl">' + NAME[card.dir] + '</span>';
    return d;
  }

  /**
   * Builder — papan kode.
   * mode: 'pool'     → kartu terbatas dari kumpulan acak (Misi 1)
   *       'palette'  → kartu tak terbatas dari 4 kartu arah (Misi 3)
   *       'readonly' → hanya menampilkan kode terkunci (Misi 2)
   */
  function Builder(opts) {
    this.slotsEl = opts.slotsEl;
    this.poolEl = opts.poolEl;
    this.zoneEl = opts.zoneEl;
    this.onChange = opts.onChange || function () {};
    this.mode = 'pool';
    this.max = 18;
    this.seq = [];
    this.all = [];
    this.pool = [];
    this.locked = false;
    this.g = null;
    var self = this;
    this._mv = function (e) { self._onMove(e); };
    this._up = function (e) { self._onUp(e); };
    this._bind(this.slotsEl);
    if (this.poolEl) this._bind(this.poolEl);
  }

  var P = Builder.prototype;

  P._bind = function (root) {
    var self = this;
    root.addEventListener('pointerdown', function (e) { self._onDown(e); });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var c = e.target.closest && e.target.closest('.card');
      if (!c || self.locked) return;
      e.preventDefault();
      self._tap({ el: c, from: c.closest('.slots') ? 'slot' : 'pool', idx: self._slotIndex(c), id: c.dataset.id, dir: c.dataset.dir });
    });
    root.addEventListener('dragstart', function (e) { e.preventDefault(); });
  };

  P._slotIndex = function (cardNode) {
    var s = cardNode.closest('.slot');
    return s ? parseInt(s.dataset.index, 10) : null;
  };

  /* ---------- konfigurasi ---------- */
  P.setupPool = function (dirsOrdered) {
    this.mode = 'pool';
    this.all = dirsOrdered.map(function (d) { return { id: ++uid, dir: d }; });
    this.pool = this.all.slice();
    this.seq = [];
    this.max = dirsOrdered.length;
    this.locked = false;
    this.render();
  };
  /** pulihkan draf: pasang kartu sesuai arah dari pool */
  P.restoreDraft = function (dirs) {
    var self = this;
    (dirs || []).forEach(function (d) {
      for (var i = 0; i < self.pool.length; i++) {
        if (self.pool[i].dir === d) { self.seq.push(self.pool.splice(i, 1)[0]); break; }
      }
    });
    this.render();
  };
  P.setupPalette = function (max, dirs) {
    this.mode = 'palette';
    this.max = max;
    this.seq = (dirs || []).slice(0, max).map(function (d) { return { id: ++uid, dir: d }; });
    this.locked = false;
    this.render();
  };
  P.setupReadonly = function (dirs) {
    this.mode = 'readonly';
    this.seq = dirs.map(function (d) { return { id: ++uid, dir: d }; });
    this.max = dirs.length;
    this.locked = true;
    this.render();
  };
  P.reset = function () {
    if (this.mode === 'pool') { this.pool = this.all.slice(); this.seq = []; }
    else if (this.mode === 'palette') { this.seq = []; }
    this.render(); this._changed();
  };
  P.setLocked = function (v) { this.locked = !!v || this.mode === 'readonly'; this.slotsEl.classList.toggle('locked', this.locked); this.poolEl && this.poolEl.classList.toggle('locked', this.locked); };
  P.dirs = function () { return this.seq.map(function (c) { return c.dir; }); };

  /* ---------- tampilan ---------- */
  P.render = function () {
    var self = this;
    var slots = this.slotsEl;
    slots.innerHTML = '';
    var n;
    if (this.mode === 'readonly') n = this.seq.length;
    else if (this.mode === 'palette') n = this.max;
    else n = this.max;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('div');
      s.className = 'slot' + (this.seq[i] ? ' filled' : '');
      s.dataset.index = i;
      var num = document.createElement('span');
      num.className = 'slot-n';
      num.textContent = i + 1;
      s.appendChild(num);
      if (this.seq[i]) s.appendChild(cardEl(this.seq[i]));
      slots.appendChild(s);
    }
    slots.classList.toggle('locked', this.locked);

    if (this.poolEl) {
      this.poolEl.innerHTML = '';
      if (this.mode === 'pool') {
        if (!this.pool.length) {
          var e = document.createElement('div');
          e.className = 'pool-empty';
          e.textContent = 'Semua kartu sudah dipasang ✔';
          this.poolEl.appendChild(e);
        }
        this.pool.forEach(function (c) { self.poolEl.appendChild(cardEl(c)); });
      } else if (this.mode === 'palette') {
        ['U', 'L', 'D', 'R'].forEach(function (d) { self.poolEl.appendChild(cardEl({ id: 'p' + d, dir: d })); });
      }
      this.poolEl.classList.toggle('locked', this.locked);
    }
  };

  P._changed = function () { this.onChange(this.dirs(), this); };

  /* ---------- penandaan saat eksekusi ---------- */
  P._slot = function (i) { return this.slotsEl.querySelector('.slot[data-index="' + i + '"]'); };
  P.setActive = function (i) {
    var prev = this.slotsEl.querySelector('.slot.active');
    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    var s = this._slot(i); if (s) { s.classList.add('active'); s.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  };
  P.finishActive = function () {
    var prev = this.slotsEl.querySelector('.slot.active');
    if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
  };
  P.markError = function (i) { var s = this._slot(i); if (s) { s.classList.remove('active'); s.classList.add('error'); } };
  P.flash = function (i) {
    var s = this._slot(i); if (!s) return;
    s.classList.remove('hint'); void s.offsetWidth; s.classList.add('hint');
    setTimeout(function () { s.classList.remove('hint'); }, 2200);
  };
  P.clearMarks = function () {
    Array.prototype.forEach.call(this.slotsEl.querySelectorAll('.slot'), function (s) {
      s.classList.remove('active', 'done', 'error', 'hint', 'ok');
    });
  };
  P.markAllOk = function () {
    Array.prototype.forEach.call(this.slotsEl.querySelectorAll('.slot.filled'), function (s, i) {
      setTimeout(function () { s.classList.add('ok'); }, i * 45);
    });
  };
  P.shakeFull = function () {
    this.slotsEl.classList.remove('shake'); void this.slotsEl.offsetWidth; this.slotsEl.classList.add('shake');
  };

  /* ---------- interaksi ---------- */
  P._onDown = function (e) {
    if (this.locked) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var c = e.target.closest('.card');
    if (!c) return;
    e.preventDefault();
    this.g = {
      el: c, from: c.closest('.slots') ? 'slot' : 'pool', idx: this._slotIndex(c),
      id: c.dataset.id, dir: c.dataset.dir, sx: e.clientX, sy: e.clientY, drag: false, ghost: null
    };
    window.addEventListener('pointermove', this._mv);
    window.addEventListener('pointerup', this._up);
    window.addEventListener('pointercancel', this._up);
  };

  P._onMove = function (e) {
    var g = this.g; if (!g) return;
    if (!g.drag) {
      if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 7) return;
      g.drag = true;
      var r = g.el.getBoundingClientRect();
      var gh = g.el.cloneNode(true);
      gh.classList.add('card-ghost');
      gh.style.width = r.width + 'px'; gh.style.height = r.height + 'px';
      document.body.appendChild(gh);
      g.ghost = gh;
      g.el.classList.add('dragging');
      document.body.classList.add('is-dragging');
      if (this.zoneEl && g.from === 'slot') this.zoneEl.classList.add('accepting');
      DA.Audio.play('pick');
    }
    g.ghost.style.left = e.clientX + 'px';
    g.ghost.style.top = e.clientY + 'px';
    var t = this._under(e.clientX, e.clientY);
    var over = this.slotsEl.querySelector('.slot.over');
    if (over && (!t.slot || over !== t.slot)) over.classList.remove('over');
    if (t.slot && !t.slot.classList.contains('over')) t.slot.classList.add('over');
    if (this.zoneEl) this.zoneEl.classList.toggle('over', !!t.zone && g.from === 'slot');
  };

  P._under = function (x, y) {
    var e = document.elementFromPoint(x, y);
    if (!e) return {};
    return {
      slot: e.closest('.slot') && this.slotsEl.contains(e.closest('.slot')) ? e.closest('.slot') : null,
      inSlots: !!e.closest('.slots') && this.slotsEl.contains(e.closest('.slots')),
      zone: this.zoneEl && this.zoneEl.contains(e) ? this.zoneEl : null
    };
  };

  P._onUp = function (e) {
    var g = this.g;
    window.removeEventListener('pointermove', this._mv);
    window.removeEventListener('pointerup', this._up);
    window.removeEventListener('pointercancel', this._up);
    this.g = null;
    if (!g) return;
    var wasDrag = g.drag;
    if (g.ghost && g.ghost.parentNode) g.ghost.parentNode.removeChild(g.ghost);
    g.el.classList.remove('dragging');
    document.body.classList.remove('is-dragging');
    var o = this.slotsEl.querySelector('.slot.over'); if (o) o.classList.remove('over');
    if (this.zoneEl) this.zoneEl.classList.remove('accepting', 'over');

    if (!wasDrag) { if (e.type !== 'pointercancel') this._tap(g); return; }
    if (e.type === 'pointercancel') return;
    this._drop(g, this._under(e.clientX, e.clientY));
  };

  /* ketuk: kartu kumpulan → pasang; kartu di slot → lepas */
  P._tap = function (g) {
    if (g.from === 'pool') {
      if (this._insert(g, null)) { DA.Audio.play('pop'); this._after(); }
    } else {
      if (this._remove(g.idx)) { DA.Audio.play('remove'); this._after(); }
    }
  };

  P._drop = function (g, t) {
    var changed = false;
    if (g.from === 'pool') {
      if (t.slot) changed = this._insert(g, parseInt(t.slot.dataset.index, 10));
      else if (t.inSlots) changed = this._insert(g, null);
      if (changed) DA.Audio.play('pop');
    } else {
      if (t.slot) {
        var to = parseInt(t.slot.dataset.index, 10);
        if (to >= this.seq.length) to = this.seq.length - 1;
        if (to !== g.idx) { var a = this.seq[g.idx]; this.seq[g.idx] = this.seq[to]; this.seq[to] = a; changed = true; DA.Audio.play('pop'); }
      } else if (t.zone) {
        changed = this._remove(g.idx);
        if (changed) DA.Audio.play('remove');
      } else if (t.inSlots) {
        var c = this.seq.splice(g.idx, 1)[0]; this.seq.push(c); changed = true; DA.Audio.play('pop');
      }
    }
    if (changed) this._after();
  };

  P._insert = function (g, idx) {
    if (this.seq.length >= this.max) { this.shakeFull(); DA.Audio.play('wrong'); return false; }
    var card;
    if (this.mode === 'pool') {
      var k = -1;
      for (var i = 0; i < this.pool.length; i++) if (String(this.pool[i].id) === String(g.id)) { k = i; break; }
      if (k < 0) return false;
      card = this.pool.splice(k, 1)[0];
    } else {
      card = { id: ++uid, dir: g.dir };
    }
    if (idx == null || idx > this.seq.length) idx = this.seq.length;
    this.seq.splice(idx, 0, card);
    return true;
  };

  P._remove = function (idx) {
    if (idx == null || !this.seq[idx]) return false;
    var card = this.seq.splice(idx, 1)[0];
    if (this.mode === 'pool') {
      this.pool.push(card);
      var order = this.all.map(function (c) { return c.id; });
      this.pool.sort(function (a, b) { return order.indexOf(a.id) - order.indexOf(b.id); });
    }
    return true;
  };

  P._after = function () { this.clearMarks(); this.render(); this._changed(); };

  DA.Cards = { Builder: Builder, arrowSVG: arrowSVG, NAME: NAME };
})();
