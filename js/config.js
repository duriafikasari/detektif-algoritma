/* =========================================================
   DETEKTIF ALGORITMA — config.js
   Konfigurasi gim: aset, labirin (grid), skor, teks.
   Semua koordinat x,y berada pada ruang gambar arena 1672 x 941.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});

  DA.CONFIG = {
    storageKey: 'detektif-algoritma-v1',

    /* Ubah di sini bila identitas pengembang berbeda. */
    developer: {
      game: 'DETEKTIF ALGORITMA',
      name: 'Duria Fikasari, S.Pd.',
      school: 'SD Negeri Seloharjo',
      topic: 'Koding dan Kecerdasan Artifisial',
      target: 'Murid Sekolah Dasar'
    },

    art: { w: 1672, h: 941 },

    classes: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],

    /* ---------------------------------------------------------
       MAZE — peta grid logis.
       Setiap entri: [kolom, baris, xPiksel, yPiksel]
       (xPiksel,yPiksel) = titik tengah petak pada gambar arena.
       Petak yang TIDAK terdaftar = pagar tanaman (dinding).
       --------------------------------------------------------- */
      maze: {
      name: 'Taman Labirin',
      start: [0, 5],
      goal: [11, 1],
      /* Labirin punya DUA jalur menuju bendera:
         jalur bawah (15 langkah) dan jalur atas (19 langkah).
         Petak yang tidak terdaftar = pagar tanaman. */
      cells: [
        [0, 5, 225, 705],                                    // MULAI (peron)
        // ===== jalur atas =====
        [0, 4, 280, 597], [0, 3, 280, 512], [0, 2, 280, 418], [0, 1, 280, 325], [0, 0, 281, 232],
        [1, 0, 383, 232], [2, 0, 485, 232],
        [2, 1, 487, 331],
        [3, 1, 588, 382], [4, 1, 688, 382], [5, 1, 788, 382],
        [6, 1, 886, 331],
        [6, 0, 886, 232], [7, 0, 987, 232], [8, 0, 1088, 232], [9, 0, 1189, 232],
        [9, 1, 1191, 330], [10, 1, 1293, 330],
        // ===== jalur bawah =====
        [1, 5, 383, 715], [2, 5, 485, 715], [3, 5, 587, 715], [4, 5, 688, 692],
        [4, 4, 688, 595], [5, 4, 789, 595], [6, 4, 889, 595], [7, 4, 990, 595], [8, 4, 1091, 595],
        [8, 3, 1091, 507], [9, 3, 1194, 507], [10, 3, 1296, 507],
        [11, 3, 1396, 470], [11, 2, 1396, 375],
        // ===== TUJUAN (dapat dicapai dari jalur atas lewat kiri, dari jalur bawah lewat bawah) =====
        [11, 1, 1400, 222]
      ]
    },

    limits: { m3Max: 19 },

    /* jeda tiap langkah (ms) */
    speeds: { slow: 1000, normal: 700, fast: 380 },

    scoring: {
      m1: { base: 100, bonusMax: 50, bonusStep: 10 },
      m2: { base: 100 },
      m3: { base: 100, alt: 50, bonusMax: 50, bonusStep: 10 }
    },

    missions: {
      1: {
        key: 'urutan', title: 'DETEKTIF URUTAN',
        badge: 'Penyusun Urutan',
        goal: 'Susun kartu arah yang masih acak menjadi urutan perintah yang benar, supaya Kiko sampai ke bendera TUJUAN.',
        intro: 'Kartu arah masih acak! Seret kartu ke slot kode dan susun urutan yang membawa Kiko dari MULAI ke TUJUAN. Lalu tekan CEK KODE.'
      },
      2: {
        key: 'jejak', title: 'DETEKTIF JEJAK',
        badge: 'Pengamat Jejak',
        goal: 'Jalankan kode hasil Misi 1 dan amati jejak langkah Kiko.',
        intro: 'Ini kode yang kamu susun di Misi 1. Kode ini terkunci. Tekan JALANKAN lalu amati: satu kartu = satu langkah Kiko!'
      },
      3: {
        key: 'algoritma', title: 'DETEKTIF ALGORITMA',
        badge: 'Penemu Rute',
        goal: 'Susun kode baru yang berbeda dari Misi 1 tetapi tetap membawa Kiko ke tujuan.',
        intro: 'Arga dan Rima berhasil menemukan satu jalan untuk Kiko. Lihat petanya: ada lorong lain menuju bendera! Bisakah kamu menyusun urutan perintah yang berbeda agar Kiko tetap sampai ke tujuan?'
      }
    },

    dirs: {
      U: { dc: 0, dr: -1, name: 'ATAS' },
      D: { dc: 0, dr: 1, name: 'BAWAH' },
      L: { dc: -1, dr: 0, name: 'KIRI' },
      R: { dc: 1, dr: 0, name: 'KANAN' }
    }
  };
})();
