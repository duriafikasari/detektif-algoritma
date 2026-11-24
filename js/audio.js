/* =========================================================
   DETEKTIF ALGORITMA — audio.js
   Musik latar & efek suara dibuat dengan Web Audio API
   (tanpa file audio eksternal). Dapat dimatikan kapan saja.
   Audio baru dimulai setelah pemain berinteraksi (aturan autoplay browser).
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});

  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var musicTimer = null, nextTime = 0, step = 0, musicOn = false;
  var listeners = [];

  /* Not (Hz) */
  var N = { C3: 130.81, G3: 196, A3: 220, F3: 174.61, E3: 164.81, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };

  /* Progresi akord ceria: C - Am - F - G (tiap akord 8 langkah 1/8) */
  var CHORDS = [
    { bass: N.C3, arp: [N.C4, N.E4, N.G4, N.E4] },
    { bass: 110, arp: [N.A3, N.C4, N.E4, N.C4] },
    { bass: 87.31, arp: [N.A3, N.C4, N.F4, N.C4] },
    { bass: 98, arp: [N.D4, N.G4, N.B4, N.G4] }
  ];
  var MELODY = [
    N.E5, 0, N.G5, 0, N.E5, N.D5, N.C5, 0,
    N.C5, 0, N.E5, 0, N.D5, N.C5, N.A4, 0,
    N.A4, 0, N.C5, 0, N.D5, N.C5, N.A4, 0,
    N.G4, 0, N.B4, 0, N.D5, 0, N.C5, 0
  ];
  var BPM = 108;
  var STEP = 60 / BPM / 2; // 1/8 not

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function tone(freq, t, dur, type, vol, dest, slideTo) {
    if (!freq) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* ---------- musik ---------- */
  function scheduleMusic() {
    if (!musicOn || !ctx) return;
    while (nextTime < ctx.currentTime + 0.3) {
      var bar = Math.floor(step / 8) % 4;
      var inBar = step % 8;
      var ch = CHORDS[bar];
      var t = nextTime;
      // arpeggio lembut
      tone(ch.arp[inBar % 4], t, STEP * 1.6, 'triangle', 0.5, musicGain);
      // bass tiap awal ketukan
      if (inBar === 0 || inBar === 4) tone(ch.bass, t, STEP * 3.4, 'sine', 0.7, musicGain);
      // melodi
      var mel = MELODY[step % MELODY.length];
      if (mel) tone(mel, t, STEP * 1.5, 'sine', 0.34, musicGain);
      nextTime += STEP;
      step++;
    }
  }
  /* Musik latar: berkas "The Logic Trail" (assets/music.mp3), diputar berulang */
  var bgm = null, bgmWanted = false, fadeTimer = null;
  function getBgm() {
    if (!bgm) {
      bgm = document.createElement('audio');
      bgm.src = 'assets/music.mp3';
      bgm.loop = true; bgm.preload = 'auto'; bgm.volume = 0;
    }
    return bgm;
  }
  function fadeTo(v, ms, done) {
    var a = getBgm(), from = a.volume, t0 = Date.now();
    clearInterval(fadeTimer);
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (v - from) * k));
      if (k >= 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 50);
  }
  function startMusic() {
    ensure();
    bgmWanted = true;
    var a = getBgm();
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function () {});
    fadeTo(0.4, 1200);
  }
  function stopMusic() {
    bgmWanted = false;
    if (bgm) fadeTo(0, 300, function () { bgm.pause(); });
  }

  /* ---------- efek suara ---------- */
  var SFX = {
    click: function (t) { tone(660, t, 0.08, 'triangle', 0.5); },
    pick: function (t) { tone(520, t, 0.07, 'triangle', 0.45); },
    pop: function (t) { tone(440, t, 0.11, 'sine', 0.7, null, 880); },
    remove: function (t) { tone(520, t, 0.12, 'sine', 0.5, null, 260); },
    step: function (t) { tone(330, t, 0.1, 'square', 0.18, null, 520); tone(660, t + 0.05, 0.08, 'triangle', 0.25); },
    bump: function (t) { tone(150, t, 0.22, 'sawtooth', 0.35, null, 70); },
    wrong: function (t) { tone(300, t, 0.16, 'triangle', 0.5); tone(240, t + 0.14, 0.24, 'triangle', 0.5); },
    correct: function (t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, t + i * 0.09, 0.22, 'triangle', 0.55); }); },
    success: function (t) {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone(f, t + i * 0.11, 0.3, 'triangle', 0.55); tone(f / 2, t + i * 0.11, 0.3, 'sine', 0.3);
      });
    },
    alt: function (t) { [880, 1174.66, 1318.5, 1760, 2093].forEach(function (f, i) { tone(f, t + i * 0.07, 0.25, 'sine', 0.42); }); },
    unlock: function (t) { tone(392, t, 0.12, 'triangle', 0.5); tone(587.33, t + 0.1, 0.12, 'triangle', 0.5); tone(784, t + 0.2, 0.28, 'triangle', 0.5); },
    star: function (t) { tone(988, t, 0.18, 'sine', 0.5); tone(1318.5, t + 0.06, 0.24, 'sine', 0.4); }
  };

  var Audio = {
    enabled: function () { return !!DA.State.get().sound; },

    /** Panggil dari event interaksi pengguna pertama. */
    unlock: function () {
      if (!Audio.enabled()) return;
      if (ensure()) startMusic();
    },

    toggle: function () {
      var on = !Audio.enabled();
      DA.State.set({ sound: on });
      if (on) { if (ensure()) startMusic(); SFX.click(ctx.currentTime); }
      else stopMusic();
      listeners.forEach(function (fn) { fn(on); });
      return on;
    },

    onChange: function (fn) { listeners.push(fn); fn(Audio.enabled()); },

    play: function (name) {
      if (!Audio.enabled() || !ensure()) return;
      var f = SFX[name];
      if (f) { try { f(ctx.currentTime + 0.01); } catch (e) { /* abaikan */ } }
    }
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (bgm) bgm.pause(); if (ctx && ctx.state === 'running') ctx.suspend(); }
    else if (Audio.enabled()) { if (ctx) ctx.resume(); if (bgmWanted && bgm) { var pr = bgm.play(); if (pr && pr.catch) pr.catch(function () {}); } }
  });

  DA.Audio = Audio;
})();
