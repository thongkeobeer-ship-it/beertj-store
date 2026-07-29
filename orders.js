// ໜ້າປະຫວັດການສັ່ງຊື້

function formatBaht(n){
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

function formatDate(iso){
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return iso; }
}

function getNewRefFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return params.get('new');
}

function renderOrders(orders){
  const list = document.getElementById('ordersList');

  if (!orders || !orders.length) {
    list.innerHTML = '<div class="empty-note">ທ່ານຍັງບໍ່ມີປະຫວັດການສັ່ງຊື້</div>';
    return;
  }

  list.innerHTML = orders.map(o => {
    const productName = o.products?.name || 'ສິນຄ້າ';
    const hasCode = !!(o.code && o.code.trim());
    return `
      <div class="order-card" data-ref="${o.ref}">
        <div class="order-card-top">
          <div>
            <div class="order-card-name">${productName}</div>
            <div class="order-card-meta">${formatDate(o.created_at)} • ຈຳນວນ ${o.quantity} ຊິ້ນ</div>
          </div>
          <div class="order-card-total">${formatBaht(o.total_price)}</div>
        </div>
        <div class="order-card-bottom">
          <div class="order-card-ref">
            ${o.ref}
            <span class="order-status">${o.status === 'paid' ? 'ສຳເລັດ' : o.status}</span>
          </div>
          ${hasCode ? `<button class="view-code-btn" data-code="${encodeURIComponent(o.code)}" data-name="${encodeURIComponent(productName)}">ເບິ່ງລະຫັດ</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.view-code-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCodeOverlay(decodeURIComponent(btn.dataset.name), decodeURIComponent(btn.dataset.code), false);
    });
  });
}

// ============================================================
// ANIMATION HELPERS — ป๊อปอัพ "ซื้อสำเร็จ / ดูรหัส"
// ============================================================

// ພິມຕົວໜັງສືທີລະໂຕ ພາຍໃນເວລາລວມທີ່ກຳນົດ (ບໍ່ໄວເກີນ ບໍ່ຊ້າເກີນ)
function typeWriterDuration(el, text, totalMs){
  if (!el) return;
  clearTimeout(el._typeTimer);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.textContent = '';
  if (prefersReducedMotion || !text) {
    el.textContent = text || '';
    return;
  }
  const chars = Array.from(text);
  const total = chars.length;
  if (!total) return;
  const stepTime = Math.max(16, Math.round(totalMs / total));
  let i = 0;
  function tick(){
    i++;
    el.textContent = chars.slice(0, i).join('');
    if (i < total) el._typeTimer = setTimeout(tick, stepTime);
  }
  tick();
}

// ຫຼິ້ນລຳດັບອນິເມຊັ່ນທັງໝົດ ຕອນເປີດ popup: ໄອຄອນຕິກຖືກເດັ້ງເຂຍົ່າ -> ປຸ່ມ (ຄັດລອກ/ปิด) ໂຜ່ລອອກ -> ຫົວຂໍ້/ຄຳອະທິບາຍພິມທີລະໂຕ
function playCodeOverlayIntro(titleText, descText){
  const icon = document.getElementById('codeOverlayIcon');
  const actions = document.getElementById('codeOverlayActions');
  const titleEl = document.getElementById('codeOverlayTitle');
  const descEl = document.getElementById('codeOverlayText');

  // reset ກ່ອນ ເພື່ອໃຫ້ animate ໄດ້ຄືນທຸກຄັ້ງທີ່ເປີດ
  if (icon) icon.classList.remove('pop-in');
  if (actions) actions.classList.remove('show');

  const iconAnimMs = 650; // ຕ້ອງກົງກັບ duration ຂອງ @keyframes codeIconPop ໃນ orders.html

  requestAnimationFrame(() => {
    if (icon) icon.classList.add('pop-in');

    // ຂໍ້ຄວາມ: ພິມທີລະໂຕ ລວມແລ້ວປະມານ 2 ວິ
    typeWriterDuration(titleEl, titleText, 700);
    typeWriterDuration(descEl, descText, 1300);

    // ປຸ່ມ ຄັດລອກ/ปิด: ໂຜ່ລອອກມາພ້ອມກັບຕອນໄອຄອນເດັ້ງສຳເລັດ
    setTimeout(() => {
      if (actions) actions.classList.add('show');
    }, iconAnimMs);
  });
}

function openCodeOverlay(productName, code, isFresh){
  const titleText = isFresh ? 'ຊື້ສຳເລັດແລ້ວ 🎉' : 'ລະຫັດສິນຄ້າ';
  const descText = isFresh
    ? `ນີ້ແມ່ນລະຫັດຂອງ "${productName}" ກະລຸນາບັນທຶກໄວ້`
    : `ລະຫັດຂອງ "${productName}"`;

  document.getElementById('codeOverlayCode').textContent = code || 'ບໍ່ມີລະຫັດ';
  document.getElementById('codeOverlay').classList.add('show');

  playCodeOverlayIntro(titleText, descText);
}

document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('backBtn');
  backBtn.addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
  if (!user) {
    window.location.href = 'login.html?redirect=orders.html';
    return;
  }

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*, products(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    document.getElementById('ordersList').innerHTML = '<div class="empty-note">ໂຫຼດປະຫວັດການສັ່ງຊື້ບໍ່ສຳເລັດ</div>';
    return;
  }

  renderOrders(orders);

  // ຖ້າຫາກໍ່ຊື້ສຳເລັດ (ມາຈາກ checkout.js) -> ເປີດ popup ໂຊວ໌ລະຫັດອັດຕະໂນມັດ
  const newRef = getNewRefFromUrl();
  if (newRef) {
    const justBought = (orders || []).find(o => o.ref === newRef);
    if (justBought) {
      openCodeOverlay(justBought.products?.name || 'ສິນຄ້າ', justBought.code, true);
    }
  }

  document.getElementById('codeOverlayClose').addEventListener('click', () => {
    document.getElementById('codeOverlay').classList.remove('show');
    // ລ້າງ ?new= ອອກຈາກ URL ເພື່ອບໍ່ໃຫ້ popup ຂຶ້ນຄືນຖ້າກົດ refresh
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    window.history.replaceState({}, '', url.toString());
  });

  document.getElementById('copyCodeBtn').addEventListener('click', () => {
    const codeText = document.getElementById('codeOverlayCode').textContent;
    navigator.clipboard?.writeText(codeText).then(() => {
      const btn = document.getElementById('copyCodeBtn');
      const original = btn.textContent;
      btn.textContent = 'ຄັດລອກແລ້ວ ✓';
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  });
});
