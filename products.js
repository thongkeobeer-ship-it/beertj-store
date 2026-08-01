// ============================================
// ໜ້າ "ສິນຄ້າທັງໝົດ" (products.html)
// ໃຊ້ຮ່ວມກັບ script.js: allProducts / productCardHtml / attachProductCardBehaviors
// ຢູ່ໃນ script.js ໂຫຼດສິນຄ້າ ແລະ render ຄັ້ງທຳອິດໃຫ້ແລ້ວ (ຮຽງໃໝ່ລ່າສຸດເປັນຄ່າເລີ່ມຕົ້ນ)
// -> ໄຟລ໌ນີ້ພຽງແຕ່ຜູກ dropdown ຈັດຮຽງ/ກັ່ນຕອງ ແລ້ວ render ຄືນຕາມທີ່ຜູ້ໃຊ້ເລືອກ
// ============================================

(function () {
  let currentSortMode = 'newest';

  function sortPriceOf(p) {
    return p.duration_enabled ? (p.minPrice || 0) : (p.price || 0);
  }

  function sortedProductList(mode) {
    const source = (typeof allProducts !== 'undefined' && Array.isArray(allProducts)) ? allProducts : [];
    let list = source.slice();

    if (mode === 'in-stock') {
      list = list.filter(p => (p.stock || 0) > 0 && !p.paused);
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return list;
    }

    if (mode === 'price-asc') {
      list.sort((a, b) => sortPriceOf(a) - sortPriceOf(b));
    } else if (mode === 'price-desc') {
      list.sort((a, b) => sortPriceOf(b) - sortPriceOf(a));
    } else if (mode === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'lo'));
    } else {
      // newest (ຄ່າເລີ່ມຕົ້ນ)
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }

  function renderSorted(mode) {
    const grid = document.getElementById('productGrid');
    if (!grid || typeof productCardHtml !== 'function') return;

    const list = sortedProductList(mode);

    if (!list.length) {
      const hasAny = (typeof allProducts !== 'undefined' && allProducts.length);
      grid.innerHTML = hasAny
        ? '<div class="empty-note">ບໍ່ພົບສິນຄ້າຕາມທີ່ເລືອກ</div>'
        : '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າ — ແອດມິນຍັງບໍ່ໄດ້ເພີ່ມສິນຄ້າ</div>';
      return;
    }

    grid.innerHTML = list.map(productCardHtml).join('');
    if (typeof attachProductCardBehaviors === 'function') attachProductCardBehaviors(list);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.getElementById('sortDropdown');
    const toggleBtn = document.getElementById('sortToggleBtn');
    const panel = document.getElementById('sortPanel');
    const toggleLabel = document.getElementById('sortToggleLabel');
    const toggleIcon = document.getElementById('sortToggleIcon');
    if (!dropdown || !toggleBtn || !panel) return;

    const openPanel = () => {
      panel.hidden = false;
      dropdown.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    };
    const closePanel = () => {
      panel.hidden = true;
      dropdown.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    };

    toggleBtn.addEventListener('click', () => {
      if (panel.hidden) openPanel(); else closePanel();
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) closePanel();
    });

    panel.querySelectorAll('.sort-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const mode = opt.dataset.sort || 'newest';
        currentSortMode = mode;

        panel.querySelectorAll('.sort-option').forEach(o => o.classList.remove('is-active'));
        opt.classList.add('is-active');

        if (toggleLabel) toggleLabel.textContent = opt.textContent.trim();
        if (toggleIcon) {
          const iconSvg = opt.querySelector('svg');
          toggleIcon.innerHTML = iconSvg ? iconSvg.outerHTML : '';
        }

        closePanel();
        renderSorted(currentSortMode);
      });
    });

    // ຖ້າສິນຄ້າຍັງໂຫຼດບໍ່ທັນສຳເລັດຕອນເປີດໜ້າ (script.js ຍັງ fetch ຢູ່) ໃຫ້ລໍຖ້າແລ້ວຄ່ອຍຈັດຮຽງຄືນ
    // ຕາມໂໝດທີ່ຜູ້ໃຊ້ເລືອກໄວ້ລ່າສຸດ (ເຜື່ອຜູ້ໃຊ້ກົດຈັດຮຽງໄວກວ່າຂໍ້ມູນຈະໂຫຼດສຳເລັດ)
    let checks = 0;
    const waitTimer = setInterval(() => {
      checks++;
      if (typeof allProducts !== 'undefined' && allProducts.length) {
        if (currentSortMode !== 'newest') renderSorted(currentSortMode);
        clearInterval(waitTimer);
      }
      if (checks > 40) clearInterval(waitTimer); // ~10 ວິນາທີ ແລ້ວເລີກລໍ
    }, 250);
  });
})();
