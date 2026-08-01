// ສະຄຣິບໜ້າຢືນຢັນການສັ່ງຊື້

let currentProduct = null;
let qty = 1;
let productDurations = [];
let selectedDuration = null;

function formatKip(n){
  return Number(n || 0).toLocaleString('en-US') + ' ກີບ';
}

// ອານິເມຊັນຂໍ້ຄວາມແບບພິມທີລະໂຕ — ໃຊ້ກັບ headline / ຊື່ສິນຄ້າ / ຄຳອະທິບາຍສັ້ນໆເທົ່ານັ້ນ
// (ຫ້າມໃຊ້ກັບ element ທີ່ມີ child element ຢູ່ຂ້າງໃນ ເຊັ່ນ: ປຸ່ມທີ່ມີ svg icon — ຈະລຶບ icon ຖິ້ມ)
function typeWriterEffect(el, text, speed = 26){
  if (!el) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !text) {
    el.textContent = text || '';
    return;
  }
  el.textContent = '';
  el.classList.add('typewriter-caret');
  let i = 0;
  const chars = Array.from(text); // ຮອງຮັບຕົວອັກສອນລາວ/ໄທ (combining marks) ໃຫ້ຖືກຕ້ອງ
  function step(){
    if (i < chars.length) {
      i++;
      el.textContent = chars.slice(0, i).join('');
      window.setTimeout(step, speed);
    } else {
      el.classList.remove('typewriter-caret');
    }
  }
  step();
}

function getProductIdFromUrl(){
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderProduct(p){
  const thumb = document.getElementById('orderThumb');
  const nameEl = document.getElementById('orderName');
  const metaEl = document.getElementById('orderMeta');

  thumb.classList.toggle('has-image', !!p.image_url);
  thumb.innerHTML = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
    : '[ ບໍ່ມີຮູບ ]';
  typeWriterEffect(nameEl, p.name, 32);
  const metaText = p.duration_enabled
    ? `${p.category || 'ສິນຄ້າ'} • ເລືອກໄລຍະເວລາທາງລຸ່ມ`
    : `${p.category || 'ສິນຄ້າ'} • ${formatKip(p.price)} / ຊິ້ນ • ຄົງເຫຼືອ ${p.stock ?? 0}`;
  typeWriterEffect(metaEl, metaText, 16);
}

// ---------- ສິນຄ້າຢຸດຂາຍຊົ່ວຄາວ ----------
function renderPausedBanner(p){
  const banner = document.getElementById('pausedBanner');
  const text = document.getElementById('pausedBannerText');
  if (!banner) return;
  if (p && p.paused) {
    text.textContent = p.paused_note
      ? `ສິນຄ້ານີ້ຢຸດຂາຍຊົ່ວຄາວ — ${p.paused_note}`
      : 'ສິນຄ້ານີ້ຢຸດຂາຍຊົ່ວຄາວ ກະລຸນາລອງໃໝ່ພາຍຫຼັງ';
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

// ---------- ລິ້ງໂບນັດ (ສະແດງສະເພາະສິນຄ້າທີ່ມີ ແລະ ປົດລັອກເມື່ອຊື້ແລ້ວເທົ່ານັ້ນ) ----------
async function loadBonusLinks(productId){
  const section = document.getElementById('bonusLinksSection');
  const grid = document.getElementById('bonusLinksGrid');
  const hint = document.getElementById('bonusLinksHint');
  if (!section) return;

  const { data: links, error } = await supabaseClient
    .from('product_links')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) { console.error(error); section.classList.remove('show'); return; }
  if (!links || !links.length) { section.classList.remove('show'); return; }

  const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
  let unlocked = false;
  if (user) {
    const { data: pastOrders, error: pastErr } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'paid')
      .limit(1);
    if (pastErr) console.error(pastErr);
    unlocked = !!(pastOrders && pastOrders.length);
  }

  hint.textContent = unlocked
    ? 'ທ່ານເຄີຍຊື້ສິນຄ້ານີ້ແລ້ວ ກົດເບິ່ງລິ້ງລຸ່ມນີ້ໄດ້ເລີຍ'
    : 'ຕ້ອງຊື້ສິນຄ້ານີ້ຢ່າງໜ້ອຍ 1 ຄັ້ງກ່ອນ ຈຶ່ງຈະກົດເບິ່ງລິ້ງໄດ້';

  const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  grid.innerHTML = links.map((l, i) => `
    <button type="button" class="bonus-link-btn ${unlocked ? '' : 'locked'}" data-url="${encodeURIComponent(l.url)}" data-locked="${unlocked ? '0' : '1'}" style="animation-delay:${(i * 0.15).toFixed(2)}s">
      ${unlocked ? '' : lockIcon}${l.label}
    </button>
  `).join('');

  grid.querySelectorAll('.bonus-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked === '1') {
        alert('ກະລຸນາຊື້ສິນຄ້ານີ້ກ່ອນ ຈຶ່ງຈະກົດເບິ່ງລິ້ງນີ້ໄດ້');
        return;
      }
      window.open(decodeURIComponent(btn.dataset.url), '_blank', 'noopener');
    });
  });

  section.classList.add('show');
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

  if (product.archived) {
    nameEl.textContent = 'ສິນຄ້ານີ້ຖືກເອົາອອກຈາກຮ້ານແລ້ວ';
    document.getElementById('orderMeta').textContent = '';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    return;
  }

  const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: product.id });
  currentProduct = { ...product, stock: stock ?? 0 };

  // ສິນຄ້ານີ້ຢຸດຂາຍຊົ່ວຄາວ -> ໂຊວ໌ແຈ້ງເຕືອນ ແລະ ປິດປຸ່ມຢືນຢັນ
  renderPausedBanner(currentProduct);
  if (currentProduct.paused) {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  }

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
  loadBonusLinks(currentProduct.id);
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
  const pageTitleEl = document.querySelector('.page-title');
  if (pageTitleEl) {
    const titleText = pageTitleEl.textContent;
    typeWriterEffect(pageTitleEl, titleText, 30);
  }

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

    if (currentProduct.paused) {
      alert('ສິນຄ້ານີ້ຢຸດຂາຍຊົ່ວຄາວ, ບໍ່ສາມາດສັ່ງຊື້ໄດ້ໃນຕອນນີ້');
      return;
    }

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