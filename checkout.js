// ສະຄຣິບໜ້າຢືນຢັນການສັ່ງຊື້

let currentProduct = null;
let qty = 1;
let productDurations = [];
let selectedDuration = null;

function formatKip(n){
  return Number(n || 0).toLocaleString('en-US') + ' ກີບ';
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
  metaEl.textContent = p.duration_enabled
    ? `${p.category || 'ສິນຄ້າ'} • ເລືອກໄລຍະເວລາທາງລຸ່ມ`
    : `${p.category || 'ສິນຄ້າ'} • ${formatKip(p.price)} / ຊິ້ນ • ຄົງເຫຼືອ ${p.stock ?? 0}`;
}

function renderDurations(){
  const section = document.getElementById('durationSection');
  const grid = document.getElementById('durationGrid');
  const hint = document.getElementById('durationHint');

  if (!currentProduct?.duration_enabled) {
    section.classList.remove('show');
    return;
  }
  section.classList.add('show');

  if (!productDurations.length) {
    grid.innerHTML = '';
    hint.textContent = 'ຍັງບໍ່ມີຕົວເລືອກໄລຍະເວລາສຳລັບສິນຄ້ານີ້';
    return;
  }

  hint.textContent = selectedDuration
    ? `${selectedDuration.label} • ${formatKip(selectedDuration.price)} • ຄົງເຫຼືອ ${selectedDuration.stock}`
    : 'ກະລຸນາເລືອກໄລຍະເວລາທີ່ຕ້ອງການ';

  grid.innerHTML = productDurations.map(d => `
    <div class="duration-pill ${selectedDuration?.id === d.id ? 'selected' : ''} ${d.stock <= 0 ? 'disabled' : ''}" data-id="${d.id}">
      <span>${d.label}</span>
      <span class="dp-price">${formatKip(d.price)}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.duration-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const d = productDurations.find(x => x.id === pill.dataset.id);
      if (!d || d.stock <= 0) return;
      selectedDuration = d;
      qty = 1;
      renderDurations();
      renderSummary();
    });
  });
}

function renderSummary(){
  const unitPrice = currentProduct?.duration_enabled
    ? (selectedDuration?.price || 0)
    : (currentProduct?.price || 0);
  const subtotal = unitPrice * qty;
  document.getElementById('qtyValue').textContent = qty;
  document.getElementById('sumSubtotal').textContent = formatKip(subtotal);
  document.getElementById('sumTotal').textContent = formatKip(subtotal);
}

function setQty(next){
  const max = currentProduct?.duration_enabled
    ? (selectedDuration?.stock ?? 1)
    : (currentProduct?.stock ?? 1);
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

  if (currentProduct.duration_enabled) {
    const { data: durations, error: durError } = await supabaseClient
      .from('product_durations')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    if (durError) console.error(durError);

    productDurations = await Promise.all((durations || []).map(async (d) => {
      const { data: dStock } = await supabaseClient.rpc('product_duration_stock', { p_duration_id: d.id });
      return { ...d, stock: dStock ?? 0 };
    }));

    selectedDuration = productDurations.find(d => d.stock > 0) || null;

    if (!productDurations.some(d => d.stock > 0)) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
    }
  } else if (currentProduct.stock <= 0) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  }

  renderProduct(currentProduct);
  renderDurations();
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

function autoGrowTextarea(el){
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

document.addEventListener('DOMContentLoaded', async () => {
  loadProduct();

  const noteInput = document.getElementById('orderNoteInput');
  autoGrowTextarea(noteInput);
  noteInput.addEventListener('input', () => autoGrowTextarea(noteInput));

  // ຊ່ອງ "ລາຍລະອຽດ" ພິມໄດ້ສະເພາະແອດມິນເທົ່ານັ້ນ (ລູກຄ້າທົ່ວໄປເຫັນແຕ່ພິມບໍ່ໄດ້)
  const noteUser = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
  const isAdminUser = noteUser && typeof ADMIN_EMAIL !== 'undefined' && noteUser.email === ADMIN_EMAIL;
  if (!isAdminUser) {
    noteInput.readOnly = true;
    noteInput.classList.add('note-readonly');
    noteInput.placeholder = 'ຊ່ອງນີ້ສະເພາະແອດມິນເທົ່ານັ້ນ';
    const noteLabel = document.getElementById('orderNoteLabel');
    if (noteLabel) noteLabel.textContent = 'ລາຍລະອຽດ (ສະເພາະແອດມິນ)';
  }

  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  document.getElementById('qtyMinus').addEventListener('click', () => setQty(qty - 1));
  document.getElementById('qtyPlus').addEventListener('click', () => setQty(qty + 1));

  const confirmBtn = document.getElementById('confirmBtn');
  const originalBtnHtml = confirmBtn.innerHTML;

  confirmBtn.addEventListener('click', async () => {
    if (!currentProduct) return;

    if (currentProduct.duration_enabled && !selectedDuration) {
      alert('ກະລຸນາເລືອກໄລຍະເວລາກ່ອນສັ່ງຊື້');
      return;
    }

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
    // (ຕ້ອງແລ່ນ supabase_migration_durations.sql ໃນ Supabase ກ່ອນ)
    const { data, error } = await supabaseClient.rpc('place_order', {
      p_product_id: currentProduct.id,
      p_quantity: qty,
      p_note: note || null,
      p_duration_id: currentProduct.duration_enabled ? selectedDuration.id : null,
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
