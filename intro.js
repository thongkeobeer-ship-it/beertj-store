// ============================================================
// intro.js — ໜ້າຈໍເປີດຕົວແບບພຣີເມຍມ໌ ຫຼິ້ນຄັ້ງດຽວຕອນຜູ້ໃຊ້ເປີດ index.html
// ລຳດັບ: ພື້ນຫຼັງເຂັ້ມ -> ໂລໂກ້ຄ່ອຍໆປາກົດ + glow + ແສງແລ່ນຜ່ານ
//        -> ໜ້າເວັບຄ່ອຍໆເປີດອອກ (navbar / hero / banner / ปุ่ม) ທີລະສ່ວນ
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

  function runIntro() {
    // ໃຫ້ browser render state ເລີ່ມຕົ້ນ (ໂລໂກ້ຖືກເຊື່ອງ/ຫຍໍ້ຢູ່) ກ່ອນ ຄ່ອຍຕິດ class ໃຫ້ transition ຫຼິ້ນ
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        splash.classList.add('intro-logo-in');
      });
    });

    // ໂລໂກ້ສະແດງ + glow + ແສງແລ່ນຜ່ານໆເສັດແລ້ວ -> ເປີດໜ້າເວັບຫຼັກອອກມາ
    window.setTimeout(() => {
      splash.classList.add('is-done');
      body.classList.add('intro-page-in');
    }, 1000);

    // ອົງປະກອບໜ້າເວັບທັງໝົດເຂົ້າທີ່ຄົບແລ້ວ -> ລ້າງ class / ເອົາ splash ອອກຈາກ DOM
    window.setTimeout(() => {
      body.classList.remove('intro-active', 'intro-page-in');
      if (splash && splash.parentNode) splash.remove();
    }, 2400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runIntro);
  } else {
    runIntro();
  }
})();
