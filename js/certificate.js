/* =========================================================
   DETEKTIF ALGORITMA — certificate.js
   Sertifikat digital (landscape A4). Bisa dicetak / disimpan
   sebagai PDF melalui fitur cetak browser.
   ========================================================= */
(function () {
  'use strict';
  var DA = (window.DA = window.DA || {});
  var $ = DA.UI.$;
  var W = 1123, H = 794;
  var oldTitle = document.title;

  function dateText() {
    var iso = DA.State.get().finishedAt;
    var d = iso ? new Date(iso) : new Date();
    try { return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return d.toDateString(); }
  }

  function render() {
    var st = DA.State.get(), p = st.player || { name: '-', kelas: '-', sekolah: '-' };
    $('cert-name').textContent = p.name;
    $('cert-class').textContent = p.kelas;
    $('cert-school').textContent = p.sekolah;
    $('cert-score').textContent = DA.Score.total();
    $('cert-stars').textContent = DA.Score.stars() + ' / 9';
    $('cert-date').textContent = dateText();
    $('cert-dev').textContent = DA.CONFIG.developer.name + ' — ' + DA.CONFIG.developer.school;
    // ukuran nama otomatis agar tidak meluap
    var n = $('cert-name'), len = p.name.length;
    n.style.fontSize = len > 26 ? '40px' : len > 18 ? '50px' : '62px';
    fit();
  }

  function fit() {
    var sc = $('cert-scale');
    if (!sc) return;
    var availW = window.innerWidth - 24;
    var availH = window.innerHeight - 96;
    var s = Math.max(0.2, Math.min(availW / W, availH / H, 1.25));
    sc.style.transform = 'scale(' + s + ')';
    var box = $('cert-box');
    box.style.width = (W * s) + 'px';
    box.style.height = (H * s) + 'px';
  }

  function print() {
    var p = DA.State.get().player;
    document.title = 'Sertifikat Detektif Algoritma - ' + (p ? p.name : '');
    var restore = function () { document.title = oldTitle; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    try { window.print(); } catch (e) { DA.UI.toast('Gunakan menu Cetak pada browser (Ctrl+P).'); }
  }

  DA.Cert = { render: render, fit: fit, print: print };
})();
