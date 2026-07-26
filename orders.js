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

function openCodeOverlay(productName, code, isFresh){
  document.getElementById('codeOverlayTitle').textContent = isFresh ? 'ຊື້ສຳເລັດແລ້ວ 🎉' : 'ລະຫັດສິນຄ້າ';
  document.getElementById('codeOverlayText').textContent = isFresh
    ? `ນີ້ແມ່ນລະຫັດຂອງ "${productName}" ກະລຸນາບັນທຶກໄວ້`
    : `ລະຫັດຂອງ "${productName}"`;
  document.getElementById('codeOverlayCode').textContent = code || 'ບໍ່ມີລະຫັດ';
  document.getElementById('codeOverlay').classList.add('show');
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
