// ============================================================
// intro.js — ໜ້າຈໍເປີດຕົວແບບພຣີເມຍມ໌ ຫຼິ້ນຄັ້ງດຽວຕອນຜູ້ໃຊ້ເປີດ index.html
// ລຳດັບ: ພື້ນຫຼັງເຂັ້ມ -> ໂລໂກ້ຊູມເຂົ້າໃກ້ເຕັມຈໍ + glow + ແສງແລ່ນຜ່ານ
//        -> ຄ້າງໄວ້ແປ໊ບໜຶ່ງ -> splash ຄ່ອຍໆຈາງອອກ ພ້ອມກັບໜ້າເວັບເປີດອອກ
//           (navbar / hero / banner / ปุ่ม) ທີລະສ່ວນແບບຊ້າໆ
// ບໍ່ກ່ຽວກັບ animation ຕອນເລື່ອນເບິ່ງ (scroll reveal ຂອງ .cat-card / .product-card) ເລີຍ — ອັນນັ້ນຄືເກົ່າ
// ============================================================

(function () {
  const body = document.body;
  const splash = document.getElementById('introSplash');

  // ບໍ່ແມ່ນໜ້າ index.html ຫຼືບໍ່ມີ splash -> ບໍ່ຕ້ອງເຮັດຫຍັງ (ໜ້າອື່ນບໍ່ມີ #introSplash ຢູ່ແລ້ວ)
  if (!splash) {
    body.classList.remove('intro-active');
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ຜູ້ໃຊ້ຕັ້ງຄ່າ reduce motion -> ຂ້າມ intro ທັງໝົດ, ໂຊວ໌ໜ້າເວັບປົກກະຕິທັນທີ
  if (prefersReducedMotion) {
    splash.remove();
    body.classList.remove('intro-active');
    return;
  }

  // ---- ຈັງຫວະເວລາ (ms) ----
  const LOGO_ZOOM_HOLD = 1350;   // ໂລໂກ້ຊູມເຂົ້າໃກ້ເຕັມຈໍ ແລ້ວຄ້າງໄວ້ແປ໊ບໜຶ່ງ ກ່ອນເລີ່ມຈາງ
  const CLEANUP_AT = 3400;       // ໜ້າເວັບເປີດອອກຄົບໝົດແລ້ວ (ອົງປະກອບຊ້າສຸດຄື ปุ่ม CTA ອັນທີ 2) -> ລ້າງ class / ເອົາ splash ອອກ

  function runIntro() {
    // ໃຫ້ browser render state ເລີ່ມຕົ້ນ (ໂລໂກ້ຖືກເຊື່ອງ/ຫຍໍ້ຢູ່) ກ່ອນ ຄ່ອຍຕິດ class ໃຫ້ transition ຫຼິ້ນ
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        splash.classList.add('intro-logo-in');
      });
    });

    // ໂລໂກ້ຊູມເຂົ້າໃກ້ເຕັມຈໍ + glow + ແສງແລ່ນຜ່ານໆ ຄ້າງໄວ້ແປ໊ບໜຶ່ງເສັດແລ້ວ -> ເລີ່ມຈາງ splash ອອກ ພ້ອມເປີດໜ້າເວັບຫຼັກ
    window.setTimeout(() => {
      splash.classList.add('is-done');
      body.classList.add('intro-page-in');
    }, LOGO_ZOOM_HOLD);

    // ອົງປະກອບໜ້າເວັບທັງໝົດເຂົ້າທີ່ຄົບແລ້ວ -> ລ້າງ class / ເອົາ splash ອອກຈາກ DOM
    window.setTimeout(() => {
      body.classList.remove('intro-active', 'intro-page-in');
      if (splash && splash.parentNode) splash.remove();
    }, CLEANUP_AT);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runIntro);
  } else {
    runIntro();
  }
})();
