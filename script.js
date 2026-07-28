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

  // ສະຖານະ: ຢຸດຂາຍຊົ່ວຄາວ > ສິນຄ້າໝົດ > ພ້ອມສົ່ງ (ຄືກັນກັບ paused-banner ຂອງ checkout.js)
  let statusText = 'ພ້ອມສົ່ງ';
  if (isPaused) statusText = 'ຢຸດຂາຍຊົ່ວຄາວ';
  else if (outOfStock) statusText = 'ສິນຄ້າໝົດ';

  // ສິນຄ້າແບບເລືອກໄລຍະເວລາ (duration_enabled) ບໍ່ມີ price ດຽວ -> ໂຊວ໌ "ເລີ່ມຕົ້ນ" ຈາກລາຄາຕ່ຳສຸດ
  const priceHtml = p.duration_enabled
    ? `<div class="price shine-text">ເລີ່ມຕົ້ນ ${formatKip(p.minPrice)}</div>`
    : `<div class="price shine-text">${formatKip(p.price)}</div>`;

  return `
  <div class="product-card ${isPaused ? 'is-paused' : ''}" data-id="${p.id}">
    <div class="product-media">
      <div class="badge-row">
        <span class="badge badge-new">ໃໝ່</span>
      </div>
      ${img}
    </div>
    <div class="product-body">
      <div class="product-eyebrow">${p.category || 'ໝວດໝູ່ສິນຄ້າ'}</div>
      <div class="product-title">${p.name}</div>
      <div class="product-status"><span class="live-dot"></span> ${statusText}</div>
      <div class="product-footer">
        ${priceHtml}
        <div class="stock">ຄົງເຫຼືອ ${p.stock || 0}</div>
      </div>
      <button class="buy-btn" ${buyDisabled ? 'disabled' : ''}>ສັ່ງຊື້ <span>→</span></button>
    </div>
  </div>`;
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
      .order('created_at', { ascending: false });
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

        return { ...p, stock: totalStock, minPrice };
      }

      const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: p.id });
      return { ...p, stock: stock ?? 0 };
    }));
    allProducts = withStock;
  }

  buildCategoryFilter();
  renderProducts(currentCategory);
}

function buildCategoryFilter(){
  const catCards = document.querySelectorAll('.cat-card');
  catCards.forEach(card => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    card.addEventListener('click', () => {
      const cat = card.dataset.category || 'all';
      currentCategory = cat;
      document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      renderProducts(currentCategory);
      const title = card.querySelector('h3')?.textContent || 'ໝວດໝູ່';
      showToast(`ກຳລັງສະແດງ: ${title}`);
    });
  });

  const showAllBtn = document.getElementById('catShowAll');
  if (showAllBtn && !showAllBtn.dataset.bound) {
    showAllBtn.dataset.bound = '1';
    showAllBtn.addEventListener('click', () => {
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
    updateStatCounts(allProducts.length, allProducts.reduce((s, p) => s + (p.stock || 0), 0));
    return;
  }

  grid.innerHTML = filtered.map(productCardHtml).join('');
  updateStatCounts(allProducts.length, allProducts.reduce((s, p) => s + (p.stock || 0), 0));
  attachProductCardBehaviors(filtered);
}

function updateStatCounts(productCount, stockCount){
  const pEl = document.getElementById('statProductCount');
  const sEl = document.getElementById('statStockCount');
  if (pEl) pEl.textContent = productCount;
  if (sEl) sEl.textContent = stockCount;
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
      window.location.href = 'checkout.html?id=' + encodeURIComponent(id);
    });
  });

  // === ກາດສິນຄ້າ: ເອັບເຟັກເຂົ້າສາກແບບ fade + slide-up ທີລະໃບ ເມື່ອເລື່ອນລົງມາເຫັນ ===
  revealCardsOnScroll(productCards);
}

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
function updateRevealCard(card){
  const progress = computeRevealProgress(card);
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

document.addEventListener('DOMContentLoaded', () => {

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
    startBtn.addEventListener('click', async () => {
      const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ປຸ່ມ "ເບິ່ງເພີ່ມເຕີມ" ຂອງລາຍການສິນຄ້າ (ໝວດ "ສິນຄ້າແນະນຳ")
  document.querySelectorAll('.section-head .see-all').forEach(btn => {
    if (btn.id === 'catShowAll') return; // ອັນນີ້ຖືກຜູກໄວ້ໃນ buildCategoryFilter ແລ້ວ
    btn.addEventListener('click', () => {
      showToast('ໄປຍັງໜ້າລາຍການທັງໝົດ');
    });
  });

  // ໝວດໝູ່ສິນຄ້າ (cat-card) ຢູ່ໃນ HTML ຢູ່ແລ້ວຕັ້ງແຕ່ຕົ້ນ -> ໃຫ້ fade + slide ສະຫຼັບຊ້າຍ-ຂວາ ເຂົ້າມາທີລະໃບ ເມື່ອເລື່ອນລົງມາເຫັນ
  revealCardsOnScroll(document.querySelectorAll('.cat-card'));

  // ໂຫຼດສິນຄ້າຈິງຈາກຖານຂໍ້ມູນ ແລະ ຕັ້ງຄ່າຕົວກອງໝວດໝູ່
  loadStoreProducts();

  // ອັບເດດສົດ: ເມື່ອແອດມິນເພີ່ມ/ແກ້ໄຂ/ລຶບສິນຄ້າ (ຫຼືປ່ຽນ paused/archived) ໜ້າຮ້ານຈະຣີເຟຣຊອັດຕະໂນມັດ
  if (typeof supabaseClient !== 'undefined') {
    supabaseClient
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadStoreProducts();
      })
      .subscribe();
  }

});
