// ==================================================================
// name-sparks.js — ສະເກັດໄຟນ້ອຍໆ ຈາງໆ ໂຜ່ຂຶ້ນຕາມຂອບຕົວໜັງສືຊື່ຮ້ານ (.brand-name)
// ໂຜ່ທຸກໆ 2 ວິ ຄັ້ງລະ 3 ຈຸດ ສຸ່ມຮອບຂອບ (ເທິງ/ຂວາ/ລຸ່ມ/ຊ້າຍ) ແລ້ວຈາງຫາຍໄວໆ
// ອີງຕາມຂະໜາດ/ຕຳແໜ່ງຈິງຂອງ .brand-name ສະເໝີ (ຮອງຮັບຊື່ຮ້ານທີ່ປ່ຽນແປງໄດ້)
// ==================================================================
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const SPARK_COLORS = ['255,207,77', '255,224,150', '184,134,11', '255,255,255', '170,180,200'];

  // ຝັງ keyframes ຂອງປະກາຍໄຟໄວ້ຄັ້ງດຽວ
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes nameSparkPop{
      0%{ opacity:0; transform:scale(0.4); }
      28%{ opacity:1; transform:scale(1.15); }
      100%{ opacity:0; transform:scale(0.3) translateY(-7px); }
    }
    .name-spark{
      position:absolute;
      border-radius:50%;
      pointer-events:none;
      z-index:2;
      animation:nameSparkPop 900ms ease-out forwards;
    }
  `;
  document.head.appendChild(styleTag);

  function spawnSparks() {
    const nameEl = document.querySelector('.brand-name');
    const host = nameEl ? nameEl.closest('.brand') : null;
    if (!nameEl || !host) return;

    const nameRect = nameEl.getBoundingClientRect();
    const hostRect = host.getBoundingClientRect();
    if (nameRect.width === 0 || hostRect.width === 0) return; // ຍັງບໍ່ໂຊວ໌ຢູ່ໃນຈໍ -> ຂ້າມຮອບນີ້

    const offsetX = nameRect.left - hostRect.left;
    const offsetY = nameRect.top - hostRect.top;
    const w = nameRect.width;
    const h = nameRect.height;

    for (let i = 0; i < 3; i++) {
      const edge = Math.floor(Math.random() * 4); // 0 ເທິງ, 1 ຂວາ, 2 ລຸ່ມ, 3 ຊ້າຍ
      let x, y;
      if (edge === 0) { x = Math.random() * w; y = -2; }
      else if (edge === 1) { x = w + 2; y = Math.random() * h; }
      else if (edge === 2) { x = Math.random() * w; y = h + 2; }
      else { x = -2; y = Math.random() * h; }

      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      const size = (2 + Math.random() * 2.2).toFixed(1);

      const spark = document.createElement('span');
      spark.className = 'name-spark';
      spark.style.left = (offsetX + x).toFixed(1) + 'px';
      spark.style.top = (offsetY + y).toFixed(1) + 'px';
      spark.style.width = size + 'px';
      spark.style.height = size + 'px';
      spark.style.background = `rgba(${color},1)`;
      spark.style.boxShadow = `0 0 5px rgba(${color},0.9), 0 0 9px rgba(${color},0.5)`;

      host.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove());
      setTimeout(() => { if (spark.parentNode) spark.remove(); }, 1200); // ສຳຮອງ ເຜື່ອ animationend ບໍ່ຍິງ (ແທັບຖືກເຊື່ອງ)
    }
  }

  function start() {
    setTimeout(spawnSparks, 500); // ຮອບທຳອິດໄວໆ ຫຼັງໜ້າໂຫຼດ ບໍ່ຕ້ອງລໍ 2 ວິ
    setInterval(spawnSparks, 2000);
  }

  document.addEventListener('visibilitychange', () => {
    // ບໍ່ຈຳເປັນຕ້ອງເຮັດຫຍັງພິເສດ — setInterval ຍັງແລ່ນຢູ່ເບື້ອງຫຼັງ ແຕ່ spawnSparks ຈະສ້າງແຄ່ຕອນ element ວັດຂະໜາດໄດ້ຈິງ
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
