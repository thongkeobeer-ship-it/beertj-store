// ============================================
// ໜ້າ "ໝວດໝູ່ສິນຄ້າທັງໝົດ" (categories.html)
// ດຶງຊື່/ຮູບໝວດໝູ່ 1-10 ຈິງຈາກ site_settings (ຕັ້ງຄ່າຢູ່ຫ້ອງແອດມິນ)
// ແລະ ຄິດໄລ່ "ຈຳນວນສິນຄ້າ" + "ຊ່ວງລາຄາ (ຕ່ຳ -> ສູງ)" ຈິງຈາກຕາຕະລາງ products / product_durations
// ============================================

(function () {
  function formatKipNumber(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function formatKipRange(min, max) {
    if (min === max) return formatKipNumber(min) + ' ກີບ';
    return formatKipNumber(min) + ' – ' + formatKipNumber(max) + ' ກີບ';
  }

  // ດຶງສິນຄ້າທີ່ຍັງໂຊວ໌ຢູ່ໜ້າຮ້ານ (ບໍ່ archived) ທັງໝົດ ແລ້ວຈັດກຸ່ມຕາມ category ຈິງ
  // ຄິດໄລ່ຈຳນວນ + ລາຄາຕ່ຳສຸດ/ສູງສຸດຂອງແຕ່ລະໝວດ (ສິນຄ້າແບບເລືອກໄລຍະເວລາ -> ໃຊ້ລາຄາຕ່ຳສຸດຂອງ product_durations)
  async function computeCategoryStats() {
    const stats = {};
    if (typeof supabaseClient === 'undefined') return stats;

    const { data: products, error } = await supabaseClient
      .from('products')
      .select('id, category, price, duration_enabled, archived')
      .eq('archived', false);

    if (error) { console.error(error); return stats; }
    if (!products || !products.length) return stats;

    const durationProductIds = products.filter(p => p.duration_enabled).map(p => p.id);
    const minPriceByProduct = {};

    if (durationProductIds.length) {
      const { data: durations, error: durError } = await supabaseClient
        .from('product_durations')
        .select('product_id, price')
        .in('product_id', durationProductIds);
      if (durError) console.error(durError);
      (durations || []).forEach((d) => {
        const cur = minPriceByProduct[d.product_id];
        if (cur === undefined || (d.price || 0) < cur) minPriceByProduct[d.product_id] = d.price || 0;
      });
    }

    products.forEach((p) => {
      const cat = (p.category || '').trim();
      if (!cat) return;
      const price = p.duration_enabled ? (minPriceByProduct[p.id] ?? 0) : (p.price || 0);
      if (!stats[cat]) stats[cat] = { count: 0, min: price, max: price };
      stats[cat].count += 1;
      if (price < stats[cat].min) stats[cat].min = price;
      if (price > stats[cat].max) stats[cat].max = price;
    });

    return stats;
  }

  function categoryPlaceholderHtml() {
    return `
      <div class="category-banner-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
      </div>`;
  }

  function categoryCardHtml(name, image, stat) {
    const safeAlt = name.replace(/"/g, '&quot;');
    const safeTitle = name.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const mediaHtml = image
      ? `<img src="${image}" alt="${safeAlt}" loading="lazy">`
      : categoryPlaceholderHtml();

    const count = stat ? stat.count : 0;
    const priceHtml = (stat && count > 0)
      ? `<span class="category-banner-price">${formatKipRange(stat.min, stat.max)}</span>`
      : '';

    return `
    <a class="category-banner-card" href="products.html?cat=${encodeURIComponent(name)}&catLabel=${encodeURIComponent(name)}">
      <div class="category-banner-media">${mediaHtml}</div>
      <div class="category-banner-body">
        <div class="category-banner-title-row">
          <span class="category-banner-title">${safeTitle}</span>
          ${priceHtml}
        </div>
        <span class="category-banner-count">ສິນຄ້າທັງໝົດ ${count} ລາຍການ</span>
      </div>
    </a>`;
  }

  async function renderCategoryBanners() {
    const grid = document.getElementById('categoryBannerGrid');
    if (!grid) return;

    const [settings, stats] = await Promise.all([
      (typeof fetchSiteSettings === 'function') ? fetchSiteSettings() : Promise.resolve({}),
      computeCategoryStats(),
    ]);

    let html = '';
    let shownCount = 0;

    for (let i = 1; i <= 10; i++) {
      const rawName = settings[`category_${i}_name`];
      const defaultName = `ໝວດໝູ່ ${i}`;
      const name = (rawName ? String(rawName) : defaultName).trim() || defaultName;
      const image = settings[`category_${i}_image`];
      const stat = stats[name];
      const hasProducts = !!(stat && stat.count > 0);
      const isCustomized = name !== defaultName;

      // ຂ້າມໝວດໝູ່ທີ່ແອດມິນຍັງບໍ່ໄດ້ຕັ້ງຄ່າຫຍັງເລີຍ (ບໍ່ມີຊື່ທີ່ຕັ້ງເອງ, ບໍ່ມີຮູບ, ບໍ່ມີສິນຄ້າ)
      if (!isCustomized && !image && !hasProducts) continue;

      shownCount++;
      html += categoryCardHtml(name, image, stat);
    }

    if (!shownCount) {
      grid.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີໝວດໝູ່ — ແອດມິນຍັງບໍ່ໄດ້ຕັ້ງຄ່າໝວດໝູ່ໃນຫ້ອງຄວບຄຸມ</div>';
      return;
    }

    grid.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCategoryBanners();

    // ອັບເດດສົດ: ຖ້າແອດມິນແກ້ໄຂຊື່/ຮູບໝວດໝູ່ ຫຼື ເພີ່ມ/ແກ້ໄຂສິນຄ້າ -> ໜ້ານີ້ຄິດໄລ່ ແລະ ສະແດງຄືນອັດຕະໂນມັດ
    if (typeof supabaseClient !== 'undefined') {
      supabaseClient
        .channel('public:categories-page')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => renderCategoryBanners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => renderCategoryBanners())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'product_durations' }, () => renderCategoryBanners())
        .subscribe();
    }
  });
})();
