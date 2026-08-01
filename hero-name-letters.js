// ==================================================================
// hero-name-letters.js — ຫໍ່ຊື່ຮ້ານໃນ hero ເປັນ span ແຍກລະໂຕ
// (ຈຳເປັນສຳລັບ animation ເດັ້ງ+ສັ່ນ ແລະ ສີໄຫຼສະຫຼັບ ໃນ style.css: .hero-name-letter)
// ຮອງຮັບຊື່ຮ້ານທີ່ປ່ຽນແປງໄດ້ (settings.js ຈະຂຽນທັບ textContent ຂອງ [data-site-name])
// -> ໃຊ້ MutationObserver ຄອຍເບິ່ງ ຖ້າຂໍ້ຄວາມປ່ຽນ ຈະຫໍ່ໃໝ່ໃຫ້ອັດຕະໂນມັດ
// + ສະເກັດໄຟນ້ອຍໆ ເດັ້ງອອກຈາກໂຕໜັງສືແຕ່ລະໂຕ ຕອນມັນສັ່ນ (sync ກັບ CSS animation ຂອງມັນເອງ)
// ==================================================================
(function () {
  const target = document.querySelector('.hero h1 .hero-name-line[data-site-name]');
  if (!target) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPARK_COLORS = ['255,207,77', '255,224,150', '255,255,255', '184,134,11'];

  let observer = null;

  function spawnLetterSpark(letterEl) {
    const host = letterEl.closest('.hero-name-line');
    if (!host) return;
    const hostRect = host.getBoundingClientRect();
    const letterRect = letterEl.getBoundingClientRect();
    if (letterRect.width === 0) return;

    const cx = letterRect.left - hostRect.left + letterRect.width / 2;
    const cy = letterRect.top - hostRect.top + letterRect.height / 2;
    const count = 3 + Math.floor(Math.random() * 2); // 3-4 ຈຸດ

    for (let k = 0; k < count; k++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 16;
      const dx = (Math.cos(angle) * dist).toFixed(1);
      const dy = (Math.sin(angle) * dist - 5).toFixed(1); // ອິງຂຶ້ນເທິງໜ້ອຍໜຶ່ງ ຄ້າຍປະກາຍໄຟ
      const size = (2 + Math.random() * 2).toFixed(1);
      const color = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];

      const spark = document.createElement('span');
      spark.className = 'hero-name-spark';
      spark.style.left = cx.toFixed(1) + 'px';
      spark.style.top = cy.toFixed(1) + 'px';
      spark.style.width = size + 'px';
      spark.style.height = size + 'px';
      spark.style.setProperty('--dx', dx + 'px');
      spark.style.setProperty('--dy', dy + 'px');
      spark.style.background = `rgba(${color},1)`;
      spark.style.boxShadow = `0 0 5px rgba(${color},0.9), 0 0 9px rgba(${color},0.5)`;

      host.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove());
      setTimeout(() => { if (spark.parentNode) spark.remove(); }, 700);
    }
  }

  function attachSparks(letters) {
    if (prefersReducedMotion) return;
    letters.forEach((span) => {
      let scheduled = null;

      function scheduleSpark() {
        const cs = getComputedStyle(span);
        // ລຳດັບ animation ໃນ CSS: heroLetterColorFlow, heroLetterBounceShake
        const durations = cs.animationDuration.split(',').map((s) => parseFloat(s) * 1000);
        const shakeDuration = durations[1] || 2600;
        if (scheduled) clearTimeout(scheduled);
        // ຈຸດເດັ່ນຂອງການສັ່ນ (ຫຼັງ pop scale ຈົບ ~28% ຂອງຮອບ) -> ຍິງສະເກັດໄຟຕອນນັ້ນ
        scheduled = setTimeout(() => spawnLetterSpark(span), shakeDuration * 0.32);
      }

      span.addEventListener('animationstart', (e) => {
        if (e.animationName === 'heroLetterBounceShake') scheduleSpark();
      });
      span.addEventListener('animationiteration', (e) => {
        if (e.animationName === 'heroLetterBounceShake') scheduleSpark();
      });
    });
  }

  function build() {
    const rawText = target.textContent;
    if (!rawText) return;

    if (observer) observer.disconnect();

    const frag = document.createDocumentFragment();
    const letters = [];
    Array.from(rawText).forEach((ch, i) => {
      const safe = ch === ' ' ? '\u00A0' : ch;
      const span = document.createElement('span');
      span.className = 'hero-name-letter';
      span.textContent = safe;
      span.setAttribute('data-letter', safe);
      span.style.setProperty('--i', i);
      frag.appendChild(span);
      letters.push(span);
    });

    target.innerHTML = '';
    target.appendChild(frag);
    attachSparks(letters);

    if (observer) observer.observe(target, { childList: true, characterData: true, subtree: true });
  }

  observer = new MutationObserver((mutations) => {
    // ຂ້າມ mutation ທີ່ເກີດຈາກ build() ເອງ (ຫໍ່ເປັນ span ຢູ່ແລ້ວ) ຫຼືສະເກັດໄຟ
    const isOwnUpdate = mutations.every((m) =>
      Array.from(m.addedNodes).every(
        (n) => n.nodeType === 1 && n.classList && (n.classList.contains('hero-name-letter') || n.classList.contains('hero-name-spark'))
      ) &&
      Array.from(m.removedNodes).every(
        (n) => n.nodeType === 1 && n.classList && n.classList.contains('hero-name-spark')
      )
    );
    if (isOwnUpdate) return;
    build();
  });

  function start() {
    build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
