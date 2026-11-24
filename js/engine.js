/* =========================================================
   DETEKTIF ALGORITMA — engine.js
   SATU mesin pergerakan grid, dipakai bersama oleh Misi 1, 2, dan 3.
   Murni logika (tanpa DOM) sehingga mudah diuji.
   ========================================================= */
(function (root) {
  'use strict';

  var DIRS = {
    U: { dc: 0, dr: -1, name: 'ATAS' },
    D: { dc: 0, dr: 1, name: 'BAWAH' },
    L: { dc: -1, dr: 0, name: 'KIRI' },
    R: { dc: 1, dr: 0, name: 'KANAN' }
  };
  var MAX_STEPS = 200; // pengaman: tidak mungkin ada loop tak berujung

  function key(c, r) { return c + ',' + r; }

  /** Bangun peta grid dari konfigurasi. Petak tak terdaftar = dinding. */
  function createMaze(cfg) {
    var cells = {};
    cfg.cells.forEach(function (a) {
      cells[key(a[0], a[1])] = { c: a[0], r: a[1], x: a[2], y: a[3], type: 'path' };
    });
    var start = cells[key(cfg.start[0], cfg.start[1])];
    var goal = cells[key(cfg.goal[0], cfg.goal[1])];
    if (!start || !goal) throw new Error('Start/goal tidak ada di daftar petak');
    start.type = 'start';
    goal.type = 'goal';
    return {
      cells: cells,
      list: cfg.cells.map(function (a) { return cells[key(a[0], a[1])]; }),
      start: start,
      goal: goal,
      get: function (c, r) { return cells[key(c, r)] || null; },
      isWall: function (c, r) { return !cells[key(c, r)]; }
    };
  }

  /**
   * Jalankan urutan perintah. Satu perintah = satu petak.
   * Berhenti jika menabrak dinding atau tiba di tujuan.
   * @param {Array<string>} seq  contoh ['R','R','U']
   * @returns {{status:string, moves:Array, path:Array, pos:Object, failIndex:number, unused:number}}
   *  status: 'goal' | 'wall' | 'short' | 'empty'
   */
  function run(maze, seq) {
    var pos = maze.start;
    var path = [pos];
    var moves = [];
    var status = seq.length ? 'short' : 'empty';
    var failIndex = -1;
    var n = Math.min(seq.length, MAX_STEPS);
    for (var i = 0; i < n; i++) {
      var d = DIRS[seq[i]];
      if (!d) { status = 'wall'; failIndex = i; moves.push({ i: i, dir: seq[i], from: pos, to: null, ok: false }); break; }
      var next = maze.get(pos.c + d.dc, pos.r + d.dr);
      if (!next) { // dinding / pagar tanaman
        moves.push({ i: i, dir: seq[i], from: pos, to: null, ok: false });
        status = 'wall';
        failIndex = i;
        break;
      }
      moves.push({ i: i, dir: seq[i], from: pos, to: next, ok: true });
      pos = next;
      path.push(pos);
      if (pos === maze.goal) { status = 'goal'; break; }
    }
    return {
      status: status,
      moves: moves,
      path: path,
      pos: pos,
      failIndex: failIndex,
      unused: seq.length - moves.length
    };
  }

  /** Kunci rute = deretan petak yang dilewati (untuk membandingkan rute). */
  function routeKey(path) {
    return path.map(function (p) { return p.c + ':' + p.r; }).join('>');
  }

  /** Rute terpendek (BFS) dari MULAI ke TUJUAN sebagai deretan arah. */
  function solve(maze) {
    var queue = [{ cell: maze.start, seq: [] }];
    var seen = {};
    seen[key(maze.start.c, maze.start.r)] = true;
    while (queue.length) {
      var cur = queue.shift();
      if (cur.cell === maze.goal) return cur.seq;
      for (var k in DIRS) {
        var d = DIRS[k];
        var nx = maze.get(cur.cell.c + d.dc, cur.cell.r + d.dr);
        if (nx && !seen[key(nx.c, nx.r)]) {
          seen[key(nx.c, nx.r)] = true;
          queue.push({ cell: nx, seq: cur.seq.concat(k) });
        }
      }
    }
    return null;
  }

  /** Posisi pertama di mana urutan pemain berbeda dari jawaban (untuk petunjuk). */
  function firstMismatch(seq, solution) {
    for (var i = 0; i < solution.length; i++) {
      if (seq[i] !== solution[i]) return i;
    }
    return -1;
  }

  var api = {
    DIRS: DIRS, createMaze: createMaze, run: run, routeKey: routeKey,
    solve: solve, firstMismatch: firstMismatch, MAX_STEPS: MAX_STEPS
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  var DA = (root.DA = root.DA || {});
  DA.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
