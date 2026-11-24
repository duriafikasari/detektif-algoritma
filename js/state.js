/* =========================================================
   DETEKTIF ALGORITMA — state.js
   Game state + penyimpanan lokal (localStorage).
   Jika localStorage tidak tersedia, gim tetap berjalan di memori.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var KEY = DA.CONFIG.storageKey;

  function blankMission() { return { done: false, stars: 0, score: 0, attempts: 0 }; }

  function defaults() {
    return {
      v: 1,
      sound: true,
      player: null,                      // {name, kelas, sekolah}
      missions: { 1: blankMission(), 2: blankMission(), 3: blankMission() },
      m1Shuffle: null,                   // urutan acak kartu Misi 1 (agar tidak berubah saat refresh)
      m1Draft: null,                     // kartu yang sudah dipasang di Misi 1 (belum dicek)
      code1: null,                       // kode Misi 1 yang BENAR  ['R','R',...]
      route1: null,                      // rute Misi 1  [[c,r],...]
      m2Success: false,
      m3Draft: null,
      code3: null,                       // kode alternatif Misi 3
      route3: null,                      // rute alternatif Misi 3
      finishedAt: null,
      badges: []
    };
  }

  var data = load();

  function load() {
    var d = defaults();
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          Object.keys(d).forEach(function (k) { if (s[k] !== undefined) d[k] = s[k]; });
          [1, 2, 3].forEach(function (n) {
            d.missions[n] = Object.assign(blankMission(), (s.missions || {})[n] || {});
          });
        }
      }
    } catch (e) { /* abaikan data rusak */ }
    return d;
  }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* mode privat */ }
  }

  var State = {
    get: function () { return data; },
    save: save,
    set: function (patch) { Object.assign(data, patch); save(); },

    setPlayer: function (p) { data.player = p; save(); },
    hasPlayer: function () { return !!(data.player && data.player.name); },

    mission: function (n) { return data.missions[n]; },
    isUnlocked: function (n) {
      if (n === 1) return true;
      return !!data.missions[n - 1].done;
    },
    allDone: function () { return [1, 2, 3].every(function (n) { return data.missions[n].done; }); },

    /** Mulai sesi baru: hapus progress tetapi pertahankan pengaturan suara. */
    reset: function () {
      var sound = data.sound;
      data = defaults();
      data.sound = sound;
      save();
    }
  };

  DA.State = State;
})();
