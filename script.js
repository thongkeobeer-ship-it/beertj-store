// ສະຄຣິບຫຼັກຂອງໜ້າຮ້ານ — ໂຫຼດສິນຄ້າຈາກ Supabase, ຖ້າຍັງບໍ່ມີສິນຄ້າໃນຖານຂໍ້ມູນ
// ຈະສະແດງສິນຄ້າຕົວຢ່າງ (demo) 30 ລາຍການແທນ ແບ່ງເປັນ 3 ໝວດໝູ່ ໝວດລະ 10 ຊິ້ນ

let allProducts = [];      // ສິນຄ້າທັງໝົດທີ່ໂຫຼດມາ (ຈິງ ຫຼື demo)
let currentCategory = 'all';
let isDemoMode = false;

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

function formatBaht(n){
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

// === ສ້າງສິນຄ້າຕົວຢ່າງ 30 ຊິ້ນ (10 ຊິ້ນ x 3 ໝວດໝູ່) ===
function generateDemoProducts(){
  const categories = ['ໝວດໝູ່ 1', 'ໝວດໝູ່ 2', 'ໝວດໝູ່ 3'];
  const products = [];
  let counter = 1;
  categories.forEach((cat, catIndex) => {
    for (let i = 1; i <= 10; i++){
      products.push({
        id: `demo-${counter}`,
        name: `ສິນຄ້າຕົວຢ່າງ ${counter}`,
        category: cat,
        price: 150 + (catIndex * 300) + (i * 25),
        stock: (counter % 7 === 0) ? 0 : 5 + (i % 6),
        image_url: null,
        created_at: new Date(Date.now() - counter * 60000).toISOString(),
        isDemo: true
      });
      counter++;
    }
  });
  return products;
}

function productCardHtml(p){
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `[ ບໍ່ມີຮູບສິນຄ້າ ]`;
  const outOfStock = (p.stock || 0) <= 0;
  return `
  <div class="product-card" data-id="${p.id}" data-demo="${p.isDemo ? '1' : '0'}">
    <div class="product-media">
      <div class="badge-row">
        <span class="badge badge-new">ໃໝ່</span>
      </div>
      ${img}
    </div>
    <div class="product-body">
      <div class="product-eyebrow">${p.category || 'ໝວດໝູ່ສິນຄ້າ'}</div>
      <div class="product-title">${p.name}</div>
      <div class="product-status"><span class="live-dot"></span> ${outOfStock ? 'ສິນຄ້າໝົດ' : 'ພ້ອມສົ່ງ'}</div>
      <div class="product-footer">
        <div class="price shine-text"><sup>฿</sup>${Number(p.price || 0).toLocaleString('th-TH')}</div>
        <div class="stock">ຄົງເຫຼືອ ${p.stock || 0}</div>
      </div>
      <button class="buy-btn" ${outOfStock ? 'disabled' : ''}>ສັ່ງຊື້ <span>→</span></button>
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
      .order('created_at', { ascending: false });
    products = res.data;
    error = res.error;
  }

  if (error) {
    console.error(error);
  }

  if (!products || !products.length) {
    // ຍັງບໍ່ມີສິນຄ້າຈິງໃນຖານຂໍ້ມູນ -> ໃຊ້ສິນຄ້າຕົວຢ່າງແທນ
    isDemoMode = true;
    allProducts = generateDemoProducts();
  } else {
    isDemoMode = false;
    const withStock = await Promise.all(products.map(async (p) => {
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
    grid.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າໃນໝວດນີ້</div>';
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
  productCards.forEach(card => {
    const btn = card.querySelector('.buy-btn');
    if (!btn || btn.disabled) return;
    btn.addEventListener('click', async () => {
      if (card.dataset.demo === '1') {
        showToast('ນີ້ແມ່ນສິນຄ້າຕົວຢ່າງ ກະລຸນາເພີ່ມສິນຄ້າຈິງໃນລະບົບແອດມິນ');
        return;
      }
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

  // === ກາດສິນຄ້າ: ເອັບເຟັກເຂົ້າສາກແບບມີມິຕິ + ລອຍໂຕເບົາໆ ===
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  productCards.forEach((card, i) => {
    card.style.setProperty('--reveal-delay', `${(i % 6) * 0.09}s`);
    const mediaSlot = card.querySelector('.product-media');
    if (mediaSlot) mediaSlot.style.setProperty('--sweep-delay', `${(i % 7) * 0.7}s`);
  });

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    productCards.forEach(card => revealObserver.observe(card));

    let ticking = false;
    const updateTilt = () => {
      const vh = window.innerHeight;
      productCards.forEach(card => {
        if (!card.classList.contains('in-view')) return;
        const rect = card.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) / vh;
        const rotate = Math.max(Math.min(offset * -12, 10), -10);
        const scale = 1 - Math.min(Math.abs(offset), 0.45) * 0.06;
        card.style.transform = `perspective(900px) rotateX(${rotate}deg) scale(${scale})`;
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateTilt);
        ticking = true;
      }
    }, { passive: true });

    updateTilt();
  }
}

document.addEventListener('DOMContentLoaded', () => {

  // ປຸ່ມເມນູ (ແຮມເບີເກີ)
  const menuBtn = document.querySelector('.menu-btn');
  if(menuBtn){
    menuBtn.addEventListener('click', () => {
      showToast('ເປີດເມນູ (ໃສ່ໂຄ້ດເມນູຂອງທ່ານຢູ່ບ່ອນນີ້)');
    });
  }

  // ປຸ່ມ CTA ຫຼັກ/ຮອງ
  const ctaButtons = document.querySelectorAll('.cta-row .btn');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`ກົດປຸ່ມ: ${btn.textContent.trim()}`);
    });
  });

  // ປຸ່ມ "ເບິ່ງເພີ່ມເຕີມ" ຂອງລາຍການສິນຄ້າ (ໝວດ "ສິນຄ້າແນະນຳ")
  document.querySelectorAll('.section-head .see-all').forEach(btn => {
    if (btn.id === 'catShowAll') return; // ອັນນີ້ຖືກຜູກໄວ້ໃນ buildCategoryFilter ແລ້ວ
    btn.addEventListener('click', () => {
      showToast('ໄປຍັງໜ້າລາຍການທັງໝົດ');
    });
  });

  // ໂຫຼດສິນຄ້າຈິງ (ຫຼືສິນຄ້າຕົວຢ່າງຖ້າຍັງບໍ່ມີ) ແລະ ຕັ້ງຄ່າຕົວກອງໝວດໝູ່
  loadStoreProducts();

  // ອັບເດດສົດ: ເມື່ອແອດມິນເພີ່ມ/ແກ້ໄຂ/ລຶບສິນຄ້າ ໜ້າຮ້ານຈະຣີເຟຣຊອັດຕະໂນມັດ
  if (typeof supabaseClient !== 'undefined') {
    supabaseClient
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadStoreProducts();
      })
      .subscribe();
  }

});
