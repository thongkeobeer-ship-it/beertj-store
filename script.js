// ສະຄຣິບຫຼັກຂອງໜ້າຮ້ານ — ໂຫຼດສິນຄ້າຈິງຈາກຖານຂໍ້ມູນ Supabase ອັດຕະໂນມັດ

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

function productCardHtml(p){
  const img = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : `[ ບໍ່ມີຮູບສິນຄ້າ ]`;
  const outOfStock = (p.stock || 0) <= 0;
  return `
  <div class="product-card" data-id="${p.id}">
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

  const { data: products, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = '<div class="empty-note">ບໍ່ສາມາດໂຫຼດສິນຄ້າໄດ້ ລອງໃໝ່ພາຍຫຼັງ</div>';
    console.error(error);
    return;
  }

  if (!products || !products.length) {
    grid.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າໃນຮ້ານຕອນນີ້</div>';
    updateStatCounts(0, 0);
    return;
  }

  const withStock = await Promise.all(products.map(async (p) => {
    const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: p.id });
    return { ...p, stock: stock ?? 0 };
  }));

  grid.innerHTML = withStock.map(productCardHtml).join('');
  updateStatCounts(withStock.length, withStock.reduce((sum, p) => sum + (p.stock || 0), 0));
  attachProductCardBehaviors(withStock);
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

  // ກາດໝວດໝູ່
  const catCards = document.querySelectorAll('.cat-card');
  catCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h3')?.textContent || 'ໝວດໝູ່';
      showToast(`ເປີດໝວດໝູ່: ${title}`);
    });
  });

  // ປຸ່ມ "ເບິ່ງທັງໝົດ" / "ເບິ່ງເພີ່ມເຕີມ"
  const seeAllButtons = document.querySelectorAll('.see-all');
  seeAllButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('ໄປຍັງໜ້າລາຍການທັງໝົດ');
    });
  });

  // ໂຫຼດສິນຄ້າຈິງຈາກຖານຂໍ້ມູນ
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
