// ============================================
// ໜ້າ "ສິນຄ້າທັງໝົດ" (products.html)
// ໃຊ້ຮ່ວມກັບ script.js: allProducts / productCardHtml / attachProductCardBehaviors
// ຢູ່ໃນ script.js ໂຫຼດສິນຄ້າ ແລະ render ຄັ້ງທຳອິດໃຫ້ແລ້ວ (ຮຽງໃໝ່ລ່າສຸດເປັນຄ່າເລີ່ມຕົ້ນ)
// -> ໄຟລ໌ນີ້ພຽງແຕ່ຜູກ dropdown ຈັດຮຽງ/ກັ່ນຕອງ ແລ້ວ render ຄືນຕາມທີ່ຜູ້ໃຊ້ເລືອກ
// ============================================

(function () {
  let currentSortMode = 'newest';

  const urlParams = new URLSearchParams(window.location.search);
  const urlCat = urlParams.get('cat') || '';
  const urlCatLabel = urlParams.get('catLabel') || urlCat;
  const urlSearch = (urlParams.get('search') || '').trim();

  // ຕັ້ງຄ່າໝວດໝູ່ທີ່ເລືອກໄວ້ (ໃຊ້ຮ່ວມກັບ currentCategory ຈາກ script.js ເພື່ອໃຫ້ renderProducts ຮອບທຳອິດຖືກຕ້ອງ)
  if (urlCat) currentCategory = urlCat;

  function sortPriceOf(p) {
    return p.duration_enabled ? (p.minPrice || 0) : (p.price || 0);
  }

  function sortedProductList(mode) {
    const source = (typeof allProducts !== 'undefined' && Array.isArray(allProducts)) ? allProducts : [];
    let list = source.slice();

    if (urlCat) list = list.filter(p => p.category === urlCat);
    if (urlSearch) {
      const q = urlSearch.toLowerCase();
      list = list.filter(p => (p.name || '').toLowerCase().includes(q));
    }

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

  function updateTitleAndFilterNote(count) {
    const titleEl = document.querySelector('.products-title-row h1');
    if (titleEl && (urlCat || urlSearch)) {
      titleEl.textContent = urlCat ? urlCatLabel : `ຜົນຄົ້ນຫາ "${urlSearch}"`;
    }

    let note = document.getElementById('productsFilterNote');
    if (urlCat || urlSearch) {
      if (!note) {
        note = document.createElement('div');
        note.id = 'productsFilterNote';
        note.className = 'products-count-note';
        const titleRow = document.querySelector('.products-title-row');
        titleRow?.insertAdjacentElement('afterend', note);
      }
      note.innerHTML = `ພົບ ${count} ລາຍການ · <a href="products.html" style="color:inherit;text-decoration:underline;">ລ້າງຕົວກອງ / ເບິ່ງທັງໝົດ</a>`;
    } else if (note) {
      note.remove();
    }
  }

  function renderSorted(mode) {
    const grid = document.getElementById('productGrid');
    if (!grid || typeof productCardHtml !== 'function') return;

    const list = sortedProductList(mode);
    updateTitleAndFilterNote(list.length);

    if (!list.length) {
      const hasAny = (typeof allProducts !== 'undefined' && allProducts.length);
      grid.innerHTML = (urlCat || urlSearch)
        ? '<div class="empty-note">ບໍ່ພົບສິນຄ້າໃນໝວດ/ຄຳຄົ້ນຫານີ້</div>'
        : (hasAny
          ? '<div class="empty-note">ບໍ່ພົບສິນຄ້າຕາມທີ່ເລືອກ</div>'
          : '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າ — ແອດມິນຍັງບໍ່ໄດ້ເພີ່ມສິນຄ້າ</div>');
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
        renderSorted(currentSortMode);
        clearInterval(waitTimer);
      }
      if (checks > 40) clearInterval(waitTimer); // ~10 ວິນາທີ ແລ້ວເລີກລໍ
    }, 250);
  });
})();
