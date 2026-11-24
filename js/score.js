/* =========================================================
   DETEKTIF ALGORITMA — score.js
   Sistem skor & bintang yang sederhana dan tidak menghukum.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var S = DA.CONFIG.scoring;

  function bonus(attempts, cfg) {
    return Math.max(0, cfg.bonusMax - Math.max(0, attempts - 1) * cfg.bonusStep);
  }
  function starsFor(attempts) { return attempts <= 1 ? 3 : attempts <= 3 ? 2 : 1; }

  var Score = {
    MAX_TOTAL: S.m1.base + S.m1.bonusMax + S.m2.base + S.m3.base + S.m3.alt + S.m3.bonusMax,
    MAX_STARS: 9,

    /** Hitung perolehan satu misi. attempts = jumlah percobaan sampai berhasil. */
    calc: function (mission, attempts) {
      var parts = [], stars;
      if (mission === 1) {
        parts.push({ label: 'Misi selesai', pts: S.m1.base });
        parts.push({ label: 'Bonus ketelitian', pts: bonus(attempts, S.m1) });
        stars = starsFor(attempts);
      } else if (mission === 2) {
        parts.push({ label: 'Jejak teramati', pts: S.m2.base });
        stars = 3;
      } else {
        parts.push({ label: 'Misi selesai', pts: S.m3.base });
        parts.push({ label: 'Rute berbeda!', pts: S.m3.alt });
        parts.push({ label: 'Bonus ketelitian', pts: bonus(attempts, S.m3) });
        stars = starsFor(attempts);
      }
      var score = parts.reduce(function (a, p) { return a + p.pts; }, 0);
      return { score: score, stars: stars, parts: parts };
    },

    /** Simpan hasil (nilai terbaik dipertahankan bila misi diulang). */
    apply: function (mission, attempts) {
      var res = Score.calc(mission, attempts);
      var m = DA.State.mission(mission);
      m.done = true;
      m.attempts = attempts;
      m.score = Math.max(m.score || 0, res.score);
      m.stars = Math.max(m.stars || 0, res.stars);
      DA.State.save();
      return res;
    },

    total: function () {
      var d = DA.State.get();
      return [1, 2, 3].reduce(function (a, n) { return a + (d.missions[n].score || 0); }, 0);
    },
    stars: function () {
      var d = DA.State.get();
      return [1, 2, 3].reduce(function (a, n) { return a + (d.missions[n].stars || 0); }, 0);
    },
    progress: function () {
      var d = DA.State.get();
      return [1, 2, 3].filter(function (n) { return d.missions[n].done; }).length;
    },
    badges: function () {
      var d = DA.State.get(), list = [];
      [1, 2, 3].forEach(function (n) {
        if (d.missions[n].done) list.push({ id: n, label: DA.CONFIG.missions[n].badge });
      });
      if (Score.progress() === 3) list.push({ id: 'final', label: 'DETEKTIF ALGORITMA' });
      return list;
    }
  };

  DA.Score = Score;
})();
