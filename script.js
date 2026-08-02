// ສະຄຣິບຫຼັກຂອງໜ້າຮ້ານ — ໂຫຼດສິນຄ້າຈາກ Supabase ເທົ່ານັ້ນ
// (ບໍ່ມີສິນຄ້າຕົວຢ່າງອີກຕໍ່ໄປ — ຈະສະແດງກໍ່ຕໍ່ເມື່ອແອດມິນເພີ່ມສິນຄ້າຈິງເຂົ້າມາ)

let allProducts = [];      // ສິນຄ້າທັງໝົດທີ່ໂຫຼດມາຈາກຖານຂໍ້ມູນຈິງ
let currentCategory = 'all';

function showToast(message){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ໃຊ້ ກີບ ໃຫ້ຄືກັນກັບ checkout.js / admin.js (ບໍ່ໃຊ້ ฿ / th-TH ອີກຕໍ່ໄປ)
function formatKip(n){
  return Number(n || 0).toLocaleString('en-US') + ' ກີບ';
}

function productCardHtml(p){
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `[ ບໍ່ມີຮູບສິນຄ້າ ]`;

  const outOfStock = (p.stock || 0) <= 0;
  const isPaused = !!p.paused;
  const buyDisabled = outOfStock || isPaused;

  // ສິນຄ້າແບບເລືອກໄລຍະເວລາ (duration_enabled) ບໍ່ມີ price ດຽວ -> ໂຊວ໌ "ເລີ່ມຕົ້ນ" ຈາກລາຄາຕ່ຳສຸດ
  const priceHtml = p.duration_enabled
    ? `<div class="price shine-text">ເລີ່ມຕົ້ນ ${formatKip(p.minPrice)}</div>`
    : `<div class="price shine-text">${formatKip(p.price)}</div>`;

  // ຈຳນວນຂາຍແລ້ວແທ້ຈິງ (ຄິດຈາກອໍເດີທີ່ status = paid)
  const soldCount = p.soldCount || 0;

  // ຂອບແດງ + ຂໍ້ຄວາມແດງເດັ່ນກາງຮູບສິນຄ້າ ເມື່ອຢຸດຂາຍຊົ່ວຄາວ (ຮວມທັງລາຍລະອຽດທີ່ແອດມິນພິມໄວ້)
  const pausedOverlayHtml = isPaused ? `
      <div class="paused-overlay">
        <svg class="paused-overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="7" y1="7" x2="17" y2="17"/></svg>
        <div class="paused-overlay-title">ຢຸດຂາຍຊົ່ວຄາວ</div>
        ${p.paused_note ? `<div class="paused-overlay-note">${p.paused_note.replace(/</g, '&lt;')}</div>` : ''}
      </div>` : '';

  // ປຸ່ມ "ສັ່ງຊື້": ຖ້າກົດບໍ່ໄດ້ ໃຫ້ເຫັນຊັດເຈນວ່າຫ້າມກົດ (ໄອຄອນຫ້າມ + ຂໍ້ຄວາມສະຖານະ) ແທນທີ່ຈະເປັນປຸ່ມແດງປົກກະຕິແຕ່ກົດບໍ່ໄດ້
  const buyBtnHtml = buyDisabled
    ? `<button class="buy-btn is-disabled" disabled type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="7" y1="7" x2="17" y2="17"/></svg>
        ${isPaused ? 'ຢຸດຂາຍຊົ່ວຄາວ' : 'ສິນຄ້າໝົດ'}
      </button>`
    : `<button class="buy-btn">ສັ່ງຊື້</button>`;

  // ປ້າຍ "Best Seller" — ໂຊວ໌ໃຫ້ສິນຄ້າທີ່ຂາຍດີ (ຂາຍແລ້ວຫຼາຍກວ່າ 5 ຊິ້ນ)
  const bestSellerHtml = soldCount >= 5
    ? `<div class="ribbon-best">Best Seller</div>`
    : '';

  return `
  <div class="product-card ${isPaused ? 'is-paused' : ''}" data-id="${p.id}">
    <div class="product-media">
      ${bestSellerHtml}
      <div class="product-note-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>
      </div>
      ${img}
      ${pausedOverlayHtml}
    </div>
    <div class="product-body">
      <div class="product-title">${p.name}</div>
      <div class="product-footer">
        ${priceHtml}
        <div class="stock">ຄັງ ${p.stock || 0}</div>
      </div>
      ${buyBtnHtml}
      <div class="sold-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        ຂາຍໄປແລ້ວ ${soldCount} ຊິ້ນ
      </div>
    </div>
  </div>`;
}

// ນັບຈຳນວນທີ່ຂາຍແລ້ວຈິງຂອງສິນຄ້າ (ລວມ quantity ຈາກທຸກອໍເດີທີ່ status = paid)
async function getSoldCount(productId){
  if (typeof supabaseClient === 'undefined') return 0;
  const { data, error } = await supabaseClient
    .from('orders')
    .select('quantity')
    .eq('product_id', productId)
    .eq('status', 'paid');
  if (error) { console.error(error); return 0; }
  return (data || []).reduce((sum, o) => sum + (o.quantity || 0), 0);
}

async function loadStoreProducts(){
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let products = null;
  let error = null;

  if (typeof supabaseClient !== 'undefined') {
    const res = await supabaseClient
      .from('products')
      .select('*')
      .eq('archived', false)   // ສິນຄ້າທີ່ແອດມິນເອົາອອກ (archived) ຕ້ອງບໍ່ໂຊວ໌ໃນໜ້າຮ້ານ
      .order('created_at', { ascending: false })
      .range(0, 99);   // ໂຫຼດສິນຄ້າໄດ້ສູງສຸດ 100 ລາຍການ (ຈາກເດີມຈຳກັດ 30)
    products = res.data;
    error = res.error;
  }

  if (error) {
    console.error(error);
  }

  if (!products || !products.length) {
    // ຍັງບໍ່ມີສິນຄ້າຈິງໃນຖານຂໍ້ມູນ -> ປ່ອຍວ່າງໄວ້ (ບໍ່ໃຊ້ສິນຄ້າຕົວຢ່າງອີກຕໍ່ໄປ)
    allProducts = [];
  } else {
    const withStock = await Promise.all(products.map(async (p) => {
      // ສິນຄ້າແບບເລືອກໄລຍະເວລາ: ສະຕັອກ ແລະ ລາຄາຕ້ອງຄິດຈາກ product_durations (ຄືກັນກັບ checkout.js)
      if (p.duration_enabled) {
        const { data: durations, error: durError } = await supabaseClient
          .from('product_durations')
          .select('*')
          .eq('product_id', p.id)
          .order('sort_order', { ascending: true });
        if (durError) console.error(durError);

        const durationsWithStock = await Promise.all((durations || []).map(async (d) => {
          const { data: dStock } = await supabaseClient.rpc('product_duration_stock', { p_duration_id: d.id });
          return { ...d, stock: dStock ?? 0 };
        }));

        const totalStock = durationsWithStock.reduce((sum, d) => sum + (d.stock || 0), 0);
        const minPrice = durationsWithStock.length
          ? Math.min(...durationsWithStock.map(d => d.price || 0))
          : 0;
        const soldCount = await getSoldCount(p.id);

        return { ...p, stock: totalStock, minPrice, soldCount };
      }

      const [{ data: stock }, soldCount] = await Promise.all([
        supabaseClient.rpc('product_stock', { p_product_id: p.id }),
        getSoldCount(p.id),
      ]);
      return { ...p, stock: stock ?? 0, soldCount };
    }));
    allProducts = withStock;
  }

  buildCategoryFilter();
  renderProducts(currentCategory);
}

// ============================================
// ລາຍການສັ່ງຊື້ລ່າສຸດ (latest-orders-row) — ດຶງອໍເດີທີ່ສຳເລັດແລ້ວຈິງຈາກຖານຂໍ້ມູນ
// ໝາຍເຫດ: ຮ້ານນີ້ບໍ່ໄດ້ເກັບຊື່ຜູ້ຊື້ແບບສາທາລະນະ (ບໍ່ມີ profiles.display_name) ແລະ
// ອີເມວແທ້ຂອງລູກຄ້າຄົນອື່ນອ່ານຈາກຝັ່ງລູກຄ້າບໍ່ໄດ້ (ຖືກປ້ອງກັນໄວ້ໂດຍ Supabase Auth)
// -> ໃຊ້ "ລະຫັດອໍເດີ" (ref) ແທນ ເພື່ອບໍ່ອວດຂໍ້ມູນສ່ວນຕົວຂອງໃຜ
// ============================================
function relativeTimeLaoOrders(dateStr){
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return 'ຫາກໍ່ນີ້';
  if (mins < 60) return mins + ' ນາທີຜ່ານມາ';
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + ' ຊົ່ວໂມງຜ່ານມາ';
  const days = Math.round(hours / 24);
  return days + ' ວັນຜ່ານມາ';
}

function latestOrderCardHtml(o){
  const p = o.products || {};
  const thumb = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name || ''}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : '';
  const amount = o.total_price ?? o.amount ?? o.price ?? (p.price ? p.price * (o.quantity || 1) : 0);
  const codeTail = (o.ref || String(o.id || '')).slice(-4);
  return `
  <div class="latest-order-card">
    <div class="latest-order-thumb">${thumb}</div>
    <div class="latest-order-info">
      <div class="latest-order-name">${p.name || 'ສິນຄ້າ'}</div>
      <div class="latest-order-price">${formatKip(amount)}</div>
      <div class="latest-order-meta">${relativeTimeLaoOrders(o.created_at)} · ອໍເດີ #${codeTail}***</div>
    </div>
  </div>`;
}

async function loadLatestOrders(){
  const track = document.getElementById('latestOrdersTrack');
  if (!track || typeof supabaseClient === 'undefined') return;
  const possibleStatuses = ['completed', 'paid', 'success', 'delivered', 'done'];
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*, products(name, image_url, price)')
      .in('status', possibleStatuses)
      .order('created_at', { ascending: false })
      .limit(6);
    if (error || !data || !data.length) {
      track.classList.add('no-loop');
      track.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີການສັ່ງຊື້</div>';
      return;
    }
    const cardsHtml = data.map(latestOrderCardHtml).join('');
    if (data.length > 1) {
      // ຊ້ຳລາຍການອອກເປັນ 2 ຊຸດ ເພື່ອໃຫ້ animation ວົນຊ້ຳໄດ້ແບບບໍ່ມີຮອຍຕໍ່ (seamless loop)
      track.classList.remove('no-loop');
      track.innerHTML = cardsHtml + cardsHtml;
    } else {
      // ມີແຄ່ 1 ລາຍການ — ບໍ່ຄວນວົນ (ຈະບໍ່ມີຫຍັງໃຫ້ເບິ່ງລະຫວ່າງຮອບ)
      track.classList.add('no-loop');
      track.innerHTML = cardsHtml;
    }
  } catch (err) {
    track.classList.add('no-loop');
    track.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີການສັ່ງຊື້</div>';
  }
}

function buildCategoryFilter(){
  const catCards = document.querySelectorAll('.cat-card');
  catCards.forEach(card => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    card.addEventListener('click', () => {
      const cat = card.dataset.category || 'all';
      const grid = document.getElementById('productGrid');

      // ໜ້ານີ້ບໍ່ມີກາດສິນຄ້າຢູ່ໃນໜ້າ (ເຊັ່ນ: ໜ້າຫຼັກ) -> ໄປໜ້າສິນຄ້າແຍກຕ່າງຫາກ ກັ່ນຕອງຕາມໝວດນີ້
      if (!grid) {
        const title = card.querySelector('.cat-card-title')?.textContent || '';
        window.location.href = (cat === 'all')
          ? 'products.html'
          : 'products.html?cat=' + encodeURIComponent(cat) + '&catLabel=' + encodeURIComponent(title);
        return;
      }

      currentCategory = cat;
      document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      renderProducts(currentCategory);
      const title = card.querySelector('.cat-card-title')?.textContent || 'ໝວດໝູ່';
      showToast(`ກຳລັງສະແດງ: ${title}`);
    });
  });

  const showAllBtn = document.getElementById('catShowAll');
  if (showAllBtn && !showAllBtn.dataset.bound) {
    showAllBtn.dataset.bound = '1';
    showAllBtn.addEventListener('click', () => {
      const grid = document.getElementById('productGrid');
      if (!grid) {
        window.location.href = 'categories.html';
        return;
      }
      currentCategory = 'all';
      document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('is-active'));
      document.querySelector('.cat-card[data-category="all"]')?.classList.add('is-active');
      renderProducts('all');
    });
  }
}

function renderProducts(category){
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const filtered = (category && category !== 'all')
    ? allProducts.filter(p => p.category === category)
    : allProducts;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າ — ແອດມິນຍັງບໍ່ໄດ້ເພີ່ມສິນຄ້າ</div>';
    updateStatCounts(
      allProducts.length,
      allProducts.reduce((s, p) => s + (p.stock || 0), 0),
      allProducts.reduce((s, p) => s + (p.soldCount || 0), 0)
    );
    return;
  }

  grid.innerHTML = filtered.map(productCardHtml).join('');
  updateStatCounts(
    allProducts.length,
    allProducts.reduce((s, p) => s + (p.stock || 0), 0),
    allProducts.reduce((s, p) => s + (p.soldCount || 0), 0)
  );
  attachProductCardBehaviors(filtered);
}

function updateStatCounts(productCount, stockCount, soldTotal){
  const pEl = document.getElementById('statProductCount');
  const sEl = document.getElementById('statStockCount');
  const soldEl = document.getElementById('statSoldCount');
  if (pEl) pEl.textContent = productCount;
  if (sEl) sEl.textContent = stockCount;
  if (soldEl) soldEl.textContent = soldTotal || 0;
}

function attachProductCardBehaviors(products){
  const productCards = document.querySelectorAll('#productGrid .product-card');

  // ປຸ່ມສັ່ງຊື້ -> ຕ້ອງເຂົ້າສູ່ລະບົບກ່ອນຈຶ່ງຈະໄປໜ້າຢືນຢັນການສັ່ງຊື້ໄດ້
  // (ປຸ່ມຖືກ disabled ໄປແລ້ວສຳລັບສິນຄ້າໝົດ/ຢຸດຂາຍຊົ່ວຄາວ ຈຶ່ງບໍ່ຕິດ handler ນີ້)
  productCards.forEach(card => {
    const btn = card.querySelector('.buy-btn');
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', async () => {
      const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
      if (!user) {
        showToast('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນສັ່ງຊື້');
        window.location.href = 'login.html?redirect=index.html';
        return;
      }
      const id = card.dataset.id;
      goToCheckout(card, id);
    });
  });

  // === ກາດສິນຄ້າ: ເອັບເຟັກເຂົ້າສາກແບບ fade + slide-up ທີລະໃບ ເມື່ອເລື່ອນລົງມາເຫັນ ===
  revealCardsOnScroll(productCards);
}

// ===== ອານິເມຊັນຕອນກົດ "ສັ່ງຊື້": ປຸ່ມ+ຊື່+ລາຄາຮ່ວງລົງ, ສະຖານະ/ຄົງເຫຼືອເລື່ອນອອກຄົນລະທາງ,
//       ແລ້ວທັງໜ້າຄ່ອຍໆຈາງອອກ ກ່ອນຈະໄປໜ້າຢືນຢັນການສັ່ງຊື້ (checkout.html ຈະຈາງເຂົ້າມາເອງ) =====
const BUY_ANIM_FALL_DELAY = 90;     // ຊື່ + ລາຄາ ເລີ່ມຮ່ວງຊ້າກວ່າປຸ່ມໜ້ອຍໜຶ່ງ ໃຫ້ເປັນຈັງຫວະ
const BUY_ANIM_PAGE_FADE_AT = 420;  // ຄ້າງໄວ້ໃຫ້ເຫັນການ໌ດຮ່ວງ/ເລື່ອນກ່ອນ ຄ່ອຍເລີ່ມຈາງທັງໜ້າ
const BUY_ANIM_PAGE_FADE_MS = 460;  // ຕ້ອງກົງກັບໄລຍະເວລາຂອງ @keyframes pageFadeOut ໃນ style.css

function goToCheckout(card, productId){
  const targetUrl = 'checkout.html?id=' + encodeURIComponent(productId);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    window.location.href = targetUrl;
    return;
  }

  const btn = card.querySelector('.buy-btn');
  const title = card.querySelector('.product-title');
  const price = card.querySelector('.price');
  const status = card.querySelector('.product-status');
  const stock = card.querySelector('.stock');

  // ກັນກົດຊ້ຳ / ກັນກົດປຸ່ມອື່ນຂະນະທີ່ກຳລັງຈະປ່ຽນໜ້າ (ໝາຍປຸ່ມທີ່ຕົນເອງປິດໄວ້ດ້ວຍ class
  // ເພື່ອໃຫ້ pageshow ຮູ້ວ່າຕ້ອງເປີດຄືນສະເພາະປຸ່ມໃດ ຖ້າຜູ້ໃຊ້ກົດຍ້ອນກັບມາຈາກ bfcache)
  document.querySelectorAll('.buy-btn:not([disabled])').forEach(b => {
    b.disabled = true;
    b.classList.add('temp-disabled');
  });
  const grid = document.getElementById('productGrid');
  if (grid) grid.style.pointerEvents = 'none';

  if (btn) btn.classList.add('is-falling');
  if (status) status.classList.add('is-sliding-left');   // "ພ້ອມສົ່ງ" -> ເລື່ອນໄປຊ້າຍ
  if (stock) stock.classList.add('is-sliding-right');    // "ຄົງເຫຼືອ" -> ເລື່ອນໄປຂວາ

  window.setTimeout(() => {
    if (title) title.classList.add('is-falling');
    if (price) price.classList.add('is-falling');
  }, BUY_ANIM_FALL_DELAY);

  window.setTimeout(() => {
    document.body.classList.add('page-leaving');
  }, BUY_ANIM_PAGE_FADE_AT);

  window.setTimeout(() => {
    window.location.href = targetUrl;
  }, BUY_ANIM_PAGE_FADE_AT + BUY_ANIM_PAGE_FADE_MS);
}

// ຖ້າຜູ້ໃຊ້ກົດຍ້ອນກັບມາໜ້ານີ້ (bfcache) ຫຼັງຈາກໜ້າເຄີຍຈາງອອກໄປ -> ຕ້ອງລ້າງ class ອອກ
// ບໍ່ດັ່ງນັ້ນໜ້າຈະຄ້າງໂປ່ງໃສ (opacity 0) ຕອນກົດຍ້ອນກັບ
window.addEventListener('pageshow', () => {
  document.body.classList.remove('page-leaving');
  document.querySelectorAll('.buy-btn.is-falling').forEach(b => b.classList.remove('is-falling'));
  document.querySelectorAll('.is-sliding-left, .is-sliding-right').forEach(el => {
    el.classList.remove('is-sliding-left', 'is-sliding-right');
  });
  const grid = document.getElementById('productGrid');
  if (grid) grid.style.pointerEvents = '';
  document.querySelectorAll('.buy-btn.temp-disabled').forEach(b => {
    b.disabled = false;
    b.classList.remove('temp-disabled');
  });
});

// ຄ່າຄວບຄຸມໄລຍະ scroll: ໃບຈະເລີ່ມເຫັນ(progress 0)ຕອນຂອບເທິງຂອງມັນຢູ່ທີ່ 92% ຄວາມສູງຈໍ (ໃກ້ລຸ່ມສຸດ)
// ແລ້ວເລື່ອນຈົນເຕັມ(progress 1)ຕອນຂອບເທິງຂອງມັນຂຶ້ນມາເຖິງ 55% ຄວາມສູງຈໍ (ເກືອບກາງຈໍ)
const REVEAL_START_VH = 0.92;
const REVEAL_END_VH = 0.55;
const REVEAL_MAX_SHIFT_Y = 60; // px ທີ່ໂຜ່ຂຶ້ນມາຈາກທາງລຸ່ມ (scroll ລົງ) / ຫຼົ່นກັບລົງ (scroll ຂຶ້ນ)
let revealListenersInitialized = false;
let revealTicking = false;

function computeRevealProgress(card){
  const rect = card.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const startPoint = vh * REVEAL_START_VH;
  const endPoint = vh * REVEAL_END_VH;
  let progress = (startPoint - rect.top) / (startPoint - endPoint);
  if (progress < 0) progress = 0;
  if (progress > 1) progress = 1;
  return progress;
}

// ບອກ browser ໃຫ້ໃຊ້ subpixel/GPU compositing (translate3d) ເພື່ອຄວາມນຸ້ມນວນ ບໍ່ກະຕຸກ
// ໝາຍເຫດ: ຄ່າ progress ຈະບໍ່ຫຼຸດລົງອີກຫຼັງຈາກເຄີຍຂຶ້ນສູງສຸດແລ້ວ (ໃຊ້ dataset.revealMax ເກັບຄ່າສູງສຸດໄວ້)
// ດັ່ງນັ້ນເມື່ອ card ໂຜ່ຂຶ້ນມາເຫັນຄົບແລ້ວ ມັນຈະຄ້າງນິ່ງຢູ່ບ່ອນນັ້ນ ບໍ່ເດັ້ງເຂົ້າ-ອອກຊ້ຳໆ ຕອນເລື່ອນຂຶ້ນລົງຜ່ານໄປມາ
function updateRevealCard(card){
  const rawProgress = computeRevealProgress(card);
  const prevMax = parseFloat(card.dataset.revealMax || '0');
  const progress = rawProgress > prevMax ? rawProgress : prevMax;
  card.dataset.revealMax = String(progress);

  const shiftY = REVEAL_MAX_SHIFT_Y * (1 - progress);
  const scale = 0.97 + progress * 0.03;

  card.style.opacity = String(progress);
  card.style.transform = `translate3d(0, ${shiftY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
}

// ຄິດໄລ່ໃໝ່ໝົດທຸກ card ທີ່ຢູ່ໃນໜ້າ ณ ຂະນະນັ້ນ (query ສົດທຸກຄັ້ງ ບໍ່ເກັບ reference ເກົ່າໄວ້
// -> ຮອງຮັບກໍລະນີ card ຖືກສ້າງໃໝ່ຈາກການປ່ຽນໝວດໝູ່ / ອັບເດດສິນຄ້າ ໂດຍບໍ່ຕ້ອງຕິດ listener ຊ້ຳຊ້ອນ)
function updateAllRevealCards(){
  document.querySelectorAll('.cat-card, .product-card').forEach(updateRevealCard);
  revealTicking = false;
}

function onRevealScrollOrResize(){
  if (!revealTicking) {
    revealTicking = true;
    requestAnimationFrame(updateAllRevealCards);
  }
}

// === reveal ທົ່ວໄປ: ໃຫ້ card (ສິນຄ້າ ຫຼື ໝວດໝູ່) ໂຜ່ຂຶ້ນມາຈາກທາງລຸ່ມຕິດກັບຕຳແໜ່ງ scroll ໂດຍກົງ (scroll-linked) ===
// ເລື່ອນລົງ -> card ໂຜ່ຂຶ້ນມາຈາກລຸ່ມ, ເລື່ອນຂຶ້ນ -> card ຫຼົ່ນກັບລົງລຸ່ມສວຍໆ (ທິດທາງດຽວກັນທັງໝົດ ບໍ່ມີຊ້າຍ/ຂວາອີກຕໍ່ໄປ)
// ຄວາມໄວການເລື່ອນ = ຄວາມໄວ card: ເລື່ອນຊ້າ card ມາຊ້າ, ເລື່ອນໄວ card ມາໄວ — ບໍ່ມີ blur
// ໝາຍເຫດສຳຄັນ: ບໍ່ໃຊ້ CSS transition/animation ອີກຕໍ່ໄປ — opacity ແລະ ຕຳແໜ່ງ ຖືກຄິດໄລ່ຈາກ
// ຕຳແໜ່ງ scroll ຈິງໆ ທຸກຄັ້ງທີ່ scroll event ຍິງ (1:1 ກັບການເລື່ອນ). ດັ່ງນັ້ນ ຖ້າຜູ້ໃຊ້ຢຸດເລື່ອນ
// card ຈະຢຸດຄ້າງທັນທີບ່ອນທີ່ມັນຢູ່ (ບໍ່ວ່າຈະຄ້າງເຄິ່ງທາງຫຼືບ່ອນໃດກໍ່ຕາມ) ແລະຖ້າເລື່ອນຕໍ່ ມັນກໍ່ຈະຕິດຕາມທັນທີ
// ບໍ່ມີ animation ໃດແລ່ນຕໍ່ໄປເອງຫຼັງຈາກຢຸດເລື່ອນ. Listener ຖືກຕິດຄັ້ງດຽວທົ່ວທັງໜ້າ (query ສົດທຸກເຟຣມ)
// ເພື່ອບໍ່ໃຫ້ listener ພອກພູນຂຶ້ນເລື່ອຍໆເມື່ອສິນຄ້າຖືກ render ໃໝ່ (ປ່ຽນໝວດໝູ່ / ອັບເດດສົດ)
function revealCardsOnScroll(cards){
  const cardList = Array.from(cards);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    cardList.forEach(card => {
      card.style.transition = 'none';
      card.style.opacity = '1';
      card.style.transform = 'none';
    });
    return;
  }

  cardList.forEach(card => {
    card.style.transition = 'none'; // ບໍ່ໃສ່ transition ໃດໆ -> ຕິດກັບ scroll ຈິງ 1:1 ທັນທີ, ບໍ່ກະຕຸກ
  });

  if (!revealListenersInitialized) {
    revealListenersInitialized = true;
    window.addEventListener('scroll', onRevealScrollOrResize, { passive: true });
    window.addEventListener('resize', onRevealScrollOrResize);
  }

  // ຄິດໄລ່ຄ່າເລີ່ມຕົ້ນທັນທີສຳລັບໃບໃໝ່ (ບໍ່ຕ້ອງລໍ scroll event ທຳອິດ)
  cardList.forEach(updateRevealCard);
}

// === ບັງຄັບໃຫ້ວິດີໂອຫນ້າຫຼັກເລ່ນອັດຕະໂນມັດ ແລະ ວົນຊ້ຳໂດຍບໍ່ຕ້ອງກົດ ===
function forceHeroVideoAutoplay(){
  const heroVideo = document.querySelector('.media-photo');
  if (!heroVideo) return;

  heroVideo.muted = true;
  heroVideo.defaultMuted = true;
  heroVideo.playsInline = true;
  heroVideo.loop = true;

  const tryPlay = () => {
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // browser ບລັອກ autoplay -> ຈະລອງເລ່ນອີກຄັ້ງທັນທີທີ່ຜູ້ໃຊ້ແຕະຫນ້າຈໍ (ບໍ່ຕ້ອງມີປຸ່ມ play ໃຫ້ກົດ)
      });
    }
  };

  // ລອງເລ່ນທັນທີທີ່ script ໂຫຼດ
  tryPlay();

  // ລອງອີກຄັ້ງເມື່ອວິດີໂອພ້ອມຫຼິ້ນ (ບາງ browser ຕ້ອງລໍຖ້າ metadata/data ໂຫຼດກ່ອນ)
  heroVideo.addEventListener('loadedmetadata', tryPlay);
  heroVideo.addEventListener('canplay', tryPlay);

  // ເນັດກັນຫລຸດ: ຖ້າ browser ຍັງບລັອກຢູ່ ໃຫ້ເລ່ນທັນທີທີ່ມີການແຕະ/ຄລິກຄັ້ງທຳອິດ (ບໍ່ຕ້ອງແຕະທີ່ວິດີໂອໂດຍກົງ)
  const unlockOnInteract = () => {
    tryPlay();
    document.removeEventListener('touchstart', unlockOnInteract);
    document.removeEventListener('click', unlockOnInteract);
    document.removeEventListener('scroll', unlockOnInteract);
  };
  document.addEventListener('touchstart', unlockOnInteract, { once: true, passive: true });
  document.addEventListener('click', unlockOnInteract, { once: true });
  document.addEventListener('scroll', unlockOnInteract, { once: true, passive: true });
}

// === ແກ້ບັກ: ປ້າຍໄຟທີ່ຕົວລະຄອນຖືຢູ່ (#heroSign) ຖືກຂຽນເປັນ HTML ຕາຍໂຕ "FIGGER!SHOP" ມາແຕ່ຕົ້ນ
//     ພໍແອດມິນປ່ຽນຊື່ຮ້ານໃນ "ຕັ້ງຄ່າຮ້ານ" (settings.js ຈະໄປອັບເດດ [data-site-name] ໃຫ້) ປ້າຍໄຟນີ້ບໍ່ຮູ້ເລື່ອງ
//     ຍັງໂຊວ໌ຊື່ເກົ່າຄ້າງໄວ້. ຟັງຊັນນີ້ຈະສ້າງໂຕໜັງສືປ້າຍໄຟຂຶ້ນໃໝ່ຈາກຊື່ຮ້ານທີ່ແທ້ຈິງທຸກຄັ້ງທີ່ມັນປ່ຽນ.
//     ໝາຍເຫດ: ຊື່ຮ້ານໃນ [data-site-name] ບາງເທື່ອຖືກຈັດເປັນໂຕໜັງສືພິເສດ (bold unicode ເຊັ່ນ 𝐒𝐇𝐎𝐏)
//     ເຊິ່ງ font ຂອງປ້າຍໄຟ (Chakra Petch) ບໍ່ມີໂຕນັ້ນ -> ໂຊວ໌ເປັນກ່ອງແທນ (ນີ້ຄືອາການ "ບັກ" ທີ່ເຫັນ)
//     ຈຶ່ງຕ້ອງ .normalize('NFKD') ກັບຄືນເປັນໂຕປົກກະຕິກ່ອນ
function syncHeroSignName(){
  const heroSign = document.getElementById('heroSign');
  const nameSource = document.querySelector('[data-site-name]');
  if (!heroSign || !nameSource) return;

  const rawName = (nameSource.textContent || '').trim();
  if (!rawName) return;

  const normalized = rawName.normalize('NFKD');
  if (heroSign.dataset.lastName === normalized) return; // ຊື່ບໍ່ປ່ຽນ -> ບໍ່ຕ້ອງສ້າງໃໝ່
  heroSign.dataset.lastName = normalized;

  heroSign.querySelectorAll('.hero-letter').forEach(el => el.remove());

  const sparkRef = heroSign.querySelector('.hero-spark');
  const frag = document.createDocumentFragment();
  Array.from(normalized).forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'hero-letter';
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    span.style.animationDelay = (i * 0.09) + 's';
    frag.appendChild(span);
  });
  heroSign.insertBefore(frag, sparkRef || null);
}

// ============================================
// ຜູ້ໃຊ້ງານອອນລາຍ (ຕົວເລກ "ຜູ້ໃຊ້ງານ" ໃນ stat-grid) — ນັບແບບສົດໆ ດ້ວຍ Supabase Realtime Presence
// ບໍ່ຕ້ອງມີຕາຕະລາງໃນຖານຂໍ້ມູນ: ທຸກຄົນທີ່ເປີດໜ້ານີ້ຄ້າງໄວ້ຈະຖືກນັບເປັນ "presence" ໜຶ່ງອັນ
// ເມື່ອຄົນອື່ນເປີດ/ປິດໜ້າ ຕົວເລກຈະອັບເດດໃຫ້ທຸກຄົນເຫັນທັນທີໂດຍບໍ່ຕ້ອງ refresh
// ============================================
function getOnlinePresenceKey() {
  try {
    let key = sessionStorage.getItem('presenceKey');
    if (!key) {
      key = 'v-' + Math.random().toString(36).slice(2) + Date.now();
      sessionStorage.setItem('presenceKey', key);
    }
    return key;
  } catch (e) {
    return 'v-' + Math.random().toString(36).slice(2) + Date.now();
  }
}

function initOnlineUsersPresence() {
  if (typeof supabaseClient === 'undefined') return;
  const el = document.getElementById('statOnlineUsers');
  if (!el) return;

  const channel = supabaseClient.channel('storefront-online-users', {
    config: { presence: { key: getOnlinePresenceKey() } }
  });

  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    el.textContent = Object.keys(state).length;
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {

  // ລອງໃສ່ຊື່ຮ້ານທີ່ຖືກຕ້ອງໃສ່ປ້າຍໄຟທັນທີ (ເຜື່ອມີຢູ່ແລ້ວ) ແລ້ວຈັບຕາເບິ່ງການປ່ຽນແປງ
  // ຕໍ່ໄປໃນອະນາຄົດ (settings.js ອາດຈະດຶງຊື່ຮ້ານມາຈາກ Supabase ແບບ async ຊ້າກວ່ານີ້)
  syncHeroSignName();
  const nameSource = document.querySelector('[data-site-name]');
  if (nameSource && 'MutationObserver' in window) {
    const heroSignObserver = new MutationObserver(() => syncHeroSignName());
    heroSignObserver.observe(nameSource, { childList: true, characterData: true, subtree: true });
  }

  // ບັງຄັບເລ່ນວິດີໂອຫນ້າຫຼັກ
  forceHeroVideoAutoplay();

  // ໝາຍເຫດ: ປຸ່ມເມນູ (ແຮມເບີເກີ) ຖືກຈັດການໂດຍ menu.js ແລ້ວ (ເປີດ/ປິດເມນູຈິງ)

  // ປຸ່ມ CTA ຫຼັກ/ຮອງ
  const topupBtn = document.getElementById('ctaTopupBtn');
  if (topupBtn) {
    topupBtn.addEventListener('click', () => {
      window.location.href = 'topup.html';
    });
  }

  const startBtn = document.getElementById('ctaStartBtn');
  if (startBtn) {
    // ປ່ຽນຂໍ້ຄວາມປຸ່ມຕາມສະຖານະ login (ຄືກັນກັບ GproShop: "ເລືອກເບິ່ງສິນຄ້າ" ຖ້າ login ແລ້ວ, "ເລີ່ມຕົ້ນນຳໃຊ້" ຖ້າຍັງບໍ່ login)
    (async () => {
      const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
      const label = document.getElementById('ctaStartBtnText');
      if (label) label.textContent = user ? 'ເລືອກເບິ່ງສິນຄ້າ' : 'ເລີ່ມຕົ້ນນຳໃຊ້';
    })();

    startBtn.addEventListener('click', async () => {
      const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      (document.getElementById('productGrid') || document.getElementById('categorySection'))
        ?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ປຸ່ມ "ⓘ" ວົງມົນ ຢູ່ຂ້າງ CTA — ສະແດງຈຸດເດັ່ນຂອງຮ້ານແບບຫຍໍ້ໆ
  const infoBtn = document.getElementById('ctaInfoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      document.querySelector('.trust-badges')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('ຊຳລະເງິນປອດໄພ • ຮັບສິນຄ້າທັນທີ • ຢືນຢັນທຸກອໍເດີ • ຝ່າຍຊ່ວຍເຫຼືອພ້ອມຕອບ');
    });
  }

  // ປຸ່ມຄົ້ນຫາ (ວົງມົນ) ຢູ່ navbar — ເປີດ/ປິດ ກ່ອງຄົ້ນຫາ ແລະ ກັ່ນຕອງລາຍການສິນຄ້າຕາມຊື່
  const searchBtn = document.getElementById('navSearchBtn');
  const searchPanel = document.getElementById('searchPanel');
  const searchInput = document.getElementById('searchPanelInput');
  if (searchBtn && searchPanel && searchInput) {
    searchBtn.addEventListener('click', () => {
      const willOpen = searchPanel.hidden;
      searchPanel.hidden = !willOpen;
      if (willOpen) searchInput.focus();
    });
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const grid = document.getElementById('productGrid');
      if (!grid) return;
      if (!q) { renderProducts(currentCategory); return; }
      const matches = allProducts.filter(p => (p.name || '').toLowerCase().includes(q));
      grid.innerHTML = matches.length
        ? matches.map(productCardHtml).join('')
        : '<div class="empty-note">ບໍ່ພົບສິນຄ້າທີ່ຄົ້ນຫາ</div>';
      attachProductCardBehaviors(matches);
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const grid = document.getElementById('productGrid');
      if (grid) return; // ໜ້ານີ້ມີກາດສິນຄ້າຢູ່ແລ້ວ, ຄົ້ນຫາແບບ live ຈັດການໃຫ້ແລ້ວຂ້າງເທິງ
      const q = searchInput.value.trim();
      if (!q) return;
      window.location.href = 'products.html?search=' + encodeURIComponent(q);
    });
  }

  // ປຸ່ມ "ເບິ່ງເພີ່ມເຕີມ" ຂອງລາຍການສິນຄ້າ (ໝວດ "ສິນຄ້າແນະນຳ") -> ໄປໜ້າສິນຄ້າທັງໝົດ (products.html)
  document.querySelectorAll('.section-head .see-all').forEach(btn => {
    if (btn.id === 'catShowAll') return; // ອັນນີ້ຖືກຜູກໄວ້ໃນ buildCategoryFilter ແລ້ວ
    btn.addEventListener('click', () => {
      window.location.href = 'products.html';
    });
  });

  // ໝວດໝູ່ສິນຄ້າ (cat-card) ຢູ່ໃນ HTML ຢູ່ແລ້ວຕັ້ງແຕ່ຕົ້ນ -> ໃຫ້ fade + slide ສະຫຼັບຊ້າຍ-ຂວາ ເຂົ້າມາທີລະໃບ ເມື່ອເລື່ອນລົງມາເຫັນ
  revealCardsOnScroll(document.querySelectorAll('.cat-card'));

  // ໂຫຼດສິນຄ້າຈິງຈາກຖານຂໍ້ມູນ ແລະ ຕັ້ງຄ່າຕົວກອງໝວດໝູ່
  loadStoreProducts();

  // ໂຫຼດລາຍການສັ່ງຊື້ລ່າສຸດ
  loadLatestOrders();

  // ເລີ່ມນັບຜູ້ໃຊ້ງານອອນລາຍແບບສົດໆ
  initOnlineUsersPresence();

  // ອັບເດດສົດ: ເມື່ອແອດມິນເພີ່ມ/ແກ້ໄຂ/ລຶບສິນຄ້າ (ຫຼືປ່ຽນ paused/archived) ໜ້າຮ້ານຈະຣີເຟຣຊອັດຕະໂນມັດ
  if (typeof supabaseClient !== 'undefined') {
    supabaseClient
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadStoreProducts();
      })
      .subscribe();

    // ມີອໍເດີໃໝ່/ອັບເດດ (ເຊັ່ນ: ຈ່າຍເງິນສຳເລັດ) -> ຣີເຟຣຊຈຳນວນ "ຂາຍແລ້ວ" ອັດຕະໂນມັດ ແບບ real-time
    supabaseClient
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadStoreProducts();
        loadLatestOrders();
      })
      .subscribe();
  }

});
