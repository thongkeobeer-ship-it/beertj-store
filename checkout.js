// ສະຄຣິບໜ້າຢືນຢັນການສັ່ງຊື້

const SHIPPING_FEE = 0; // ປັບຄ່າສົ່ງຕາມຈິງໄດ້ທີ່ນີ້ (0 = ຟຣີ)

let currentProduct = null;
let qty = 1;

function formatBaht(n){
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

function getProductIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderProduct(p){
  const thumb = document.getElementById('orderThumb');
  const nameEl = document.getElementById('orderName');
  const metaEl = document.getElementById('orderMeta');

  thumb.innerHTML = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : '[ ບໍ່ມີຮູບ ]';
  nameEl.textContent = p.name;
  metaEl.textContent = `${p.category || 'ສິນຄ້າ'} • ${formatBaht(p.price)} / ຊິ້ນ • ຄົງເຫຼືອ ${p.stock ?? 0}`;
}

function renderSummary(){
  const subtotal = (currentProduct?.price || 0) * qty;
  const total = subtotal + SHIPPING_FEE;
  document.getElementById('qtyValue').textContent = qty;
  document.getElementById('sumSubtotal').textContent = formatBaht(subtotal);
  document.getElementById('sumShipping').textContent = SHIPPING_FEE > 0 ? formatBaht(SHIPPING_FEE) : 'ຟຣີ';
  document.getElementById('sumTotal').textContent = formatBaht(total);
}

function setQty(next){
  const max = currentProduct?.stock ?? 1;
  qty = Math.max(1, Math.min(next, Math.max(max, 1)));
  renderSummary();
}

async function loadProduct(){
  const id = getProductIdFromUrl();
  const nameEl = document.getElementById('orderName');
  const confirmBtn = document.getElementById('confirmBtn');

  if (!id) {
    nameEl.textContent = 'ບໍ່ພົບສິນຄ້າທີ່ເລືອກ';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    return;
  }

  if (typeof supabaseClient === 'undefined') {
    nameEl.textContent = 'ຍັງບໍ່ໄດ້ຕັ້ງຄ່າການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    return;
  }

  const { data: product, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    nameEl.textContent = 'ບໍ່ພົບສິນຄ້ານີ້ໃນຮ້ານ';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    return;
  }

  const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: product.id });
  currentProduct = { ...product, stock: stock ?? 0 };

  if (currentProduct.stock <= 0) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  }

  renderProduct(currentProduct);
  renderSummary();
}

// ແປລະຫັດ error ຈາກ Postgres/RPC ໃຫ້ເປັນຂໍ້ຄວາມທີ່ອ່ານແລ້ວເຂົ້າໃຈ
function friendlyOrderError(error){
  const msg = error?.message || '';
  if (msg.includes('ຍອດເງິນບໍ່ພຽງພໍ')) return 'ຍອດເງິນໃນກະເປົ໋າຂອງທ່ານບໍ່ພຽງພໍ';
  if (msg.includes('ສະຕັອກບໍ່ພຽງພໍ')) return msg;
  if (msg.includes('ເຂົ້າສູ່ລະບົບ')) return 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນສັ່ງຊື້';
  if (msg.includes('ບໍ່ພົບສິນຄ້າ')) return 'ບໍ່ພົບສິນຄ້ານີ້ໃນຮ້ານແລ້ວ';
  return msg || 'ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່ອີກຄັ້ງ';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProduct();

  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  document.getElementById('qtyMinus').addEventListener('click', () => setQty(qty - 1));
  document.getElementById('qtyPlus').addEventListener('click', () => setQty(qty + 1));

  const confirmBtn = document.getElementById('confirmBtn');
  const originalBtnHtml = confirmBtn.innerHTML;

  confirmBtn.addEventListener('click', async () => {
    if (!currentProduct) return;

    const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
    if (!user) {
      window.location.href = 'login.html?redirect=checkout.html?id=' + encodeURIComponent(currentProduct.id);
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.6';
    confirmBtn.textContent = 'ກຳລັງດຳເນີນການ...';

    const note = document.getElementById('orderNoteInput').value.trim();

    // ເອີ້ນ function ດຽວທີ່ກວດສະຕັອກ + ຫັກເງິນ + ບັນທຶກອໍເດີ ໃນທຣານແຊັກຊັນດຽວ
    // (ຕ້ອງແລ່ນ place_order_setup.sql ໃນ Supabase ກ່ອນ)
    const { data, error } = await supabaseClient.rpc('place_order', {
      p_product_id: currentProduct.id,
      p_quantity: qty,
      p_note: note || null,
    });

    if (error || !data) {
      alert(friendlyOrderError(error));
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = '1';
      confirmBtn.innerHTML = originalBtnHtml;
      // ໂຫຼດຂໍ້ມູນສິນຄ້າ/ສະຕັອກຄືນໃໝ່ ເຜື່ອສະຕັອກປ່ຽນໄປແລ້ວ
      loadProduct();
      return;
    }

    // ຊື້ສຳເລັດ -> ເດັ້ງໄປໜ້າປະຫວັດການສັ່ງຊື້ທັນທີ ພ້ອມ ref ຂອງອໍເດີທີ່ຫາກໍ່ຊື້
    // (orders.html ຈະເປີດ popup ໂຊວ໌ລະຫັດຂອງອໍເດີນີ້ໂດຍອັດຕະໂນມັດ)
    window.location.href = 'orders.html?new=' + encodeURIComponent(data.ref);
  });
});
