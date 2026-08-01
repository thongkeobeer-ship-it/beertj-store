// ==================================================================
// hero-name-letters.js — ຫໍ່ຊື່ຮ້ານໃນ hero ເປັນ span ແຍກລະໂຕ
// (ຈຳເປັນສຳລັບ animation ເດັ້ງ+ສັ່ນ ແລະ ສີໄຫຼສະຫຼັບ ໃນ style.css: .hero-name-letter)
// ຮອງຮັບຊື່ຮ້ານທີ່ປ່ຽນແປງໄດ້ (settings.js ຈະຂຽນທັບ textContent ຂອງ [data-site-name])
// -> ໃຊ້ MutationObserver ຄອຍເບິ່ງ ຖ້າຂໍ້ຄວາມປ່ຽນ ຈະຫໍ່ໃໝ່ໃຫ້ອັດຕະໂນມັດ
// ==================================================================
(function () {
  const target = document.querySelector('.hero h1 .hero-name-line[data-site-name]');
  if (!target) return;

  let observer = null;

  function build() {
    const rawText = target.textContent;
    if (!rawText) return;

    if (observer) observer.disconnect();

    const frag = document.createDocumentFragment();
    Array.from(rawText).forEach((ch, i) => {
      const safe = ch === ' ' ? '\u00A0' : ch;
      const span = document.createElement('span');
      span.className = 'hero-name-letter';
      span.textContent = safe;
      span.setAttribute('data-letter', safe);
      span.style.setProperty('--i', i);
      frag.appendChild(span);
    });

    target.innerHTML = '';
    target.appendChild(frag);

    if (observer) observer.observe(target, { childList: true, characterData: true, subtree: true });
  }

  observer = new MutationObserver((mutations) => {
    // ຂ້າມ mutation ທີ່ເກີດຈາກ build() ເອງ (ຫໍ່ເປັນ span ຢູ່ແລ້ວ)
    const isOwnUpdate = mutations.every((m) =>
      Array.from(m.addedNodes).every((n) => n.nodeType === 1 && n.classList && n.classList.contains('hero-name-letter'))
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
