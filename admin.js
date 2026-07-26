// ============================================
// ໜ້າຄວບຄຸມແອດມິນ — ເພີ່ມ/ແກ້ໄຂສິນຄ້າ, ເຕີມລະຫັດ ແລະ ຄຳຂໍເຕີມເງິນ
// ============================================

let currentProducts = [];
let selectedImageFile = null;

function setMsg(el, text, kind) {
  el.classList.remove('show', 'error', 'success', 'pending');
  if (!text) return;
  el.textContent = text;
  el.classList.add('show', kind);
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

function formatBaht(n) {
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

function formatKipAdmin(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

// ---------- ປ້ອງກັນໜ້ານີ້: ສະເພາະແອດມິນເທົ່ານັ້ນ ----------
async function guardAdmin() {
  const user = await getCurrentUser();
  const gate = document.getElementById('gate');
  const app = document.getElementById('adminApp');

  if (!user) {
    window.location.href = 'login.html?redirect=admin.html';
    return false;
  }
  const admin = await isAdmin();
  if (!admin) {
    gate.innerHTML = '<div style="color:var(--gx-danger)">ບັນຊີນີ້ບໍ່ມີສິດເຂົ້າໜ້ານີ້</div>';
    setTimeout(() => { window.location.href = 'index.html'; }, 1400);
    return false;
  }
  gate.style.display = 'none';
  app.style.display = 'block';
  return true;
}

// ---------- ແຖບສະຖານະລວມ (ops strip) ----------
function renderOpsStrip(products, totalStock) {
  const strip = document.getElementById('opsStrip');
  strip.innerHTML = `
    <div class="ops-chip"><div class="ops-num">${products.length}</div><div class="ops-label">ສິນຄ້າທັງໝົດ</div></div>
    <div class="ops-chip"><div class="ops-num">${totalStock}</div><div class="ops-label">ລະຫັດຄົງເຫຼືອ</div></div>
  `;
  // ຄືນຄ່າ chip ຈຳນວນຄຳຂໍເຕີມເງິນ (ຖ້າມີ) ຫຼັງຈາກ render ໃໝ່
  if (typeof window.__pendingTopupCount === 'number') {
    appendTopupOpsChip(window.__pendingTopupCount);
  }
}

function appendTopupOpsChip(count) {
  window.__pendingTopupCount = count;
  const strip = document.getElementById('opsStrip');
  if (!strip) return;
  const old = strip.querySelector('.ops-chip.topup-chip');
  if (old) old.remove();
  const chip = document.createElement('div');
  chip.className = 'ops-chip topup-chip';
  chip.innerHTML = `<div class="ops-num">${count}</div><div class="ops-label">ຄຳຂໍລໍຖ້າ</div>`;
  strip.appendChild(chip);

  const badge = document.getElementById('topupBadge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ---------- ດຶງລາຍການສິນຄ້າ + ສະຕັອກຂອງແຕ່ລະລາຍການ ----------
async function loadProducts() {
  const { data: products, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const withStock = await Promise.all((products || []).map(async (p) => {
    const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: p.id });
    return { ...p, stock: stock ?? 0 };
  }));

  currentProducts = withStock;
  const totalStock = withStock.reduce((sum, p) => sum + (p.stock || 0), 0);
  renderOpsStrip(withStock, totalStock);
  renderManageList(withStock);
  renderCodeProductSelect(withStock);
  renderCategoryOptions(withStock);
  return withStock;
}

// ---------- ຕົວເລືອກໝວດໝູ່ (ດຶງມາຈາກໝວດໝູ່ຂອງສິນຄ້າທີ່ມີຢູ່ແລ້ວ) ----------
function renderCategoryOptions(products) {
  const select = document.getElementById('pCategorySelect');
  if (!select) return;

  const categories = [...new Set(
    products.map(p => (p.category || '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'th'));

  const prevValue = select.value;
  select.innerHTML =
    '<option value="">ເລືອກໝວດໝູ່</option>' +
    categories.map(c => `<option value="${c.replace(/"/g, '&quot;')}">${c}</option>`).join('') +
    '<option value="__new__">+ ເພີ່ມໝວດໝູ່ໃໝ່</option>';

  if (prevValue && (categories.includes(prevValue) || prevValue === '__new__')) {
    select.value = prevValue;
  }
}

// ---------- ແຜງຈັດການສິນຄ້າ (ແກ້ຊື່/ລາຄາ/ລຶບ) ----------
function renderManageList(products) {
  const list = document.getElementById('manageList');
  if (!products.length) {
    list.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີສິນຄ້າ — ເພີ່ມສິນຄ້າກ່ອນທີ່ແຖບ "ເພີ່ມສິນຄ້າ"</div>';
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="prod-row" data-id="${p.id}">
      <img class="prod-thumb" src="${p.image_url || ''}" onerror="this.style.opacity=0" alt="">
      <div class="prod-fields">
        <div class="gx-row2">
          <input type="text" class="edit-name" value="${(p.name || '').replace(/"/g, '&quot;')}" placeholder="ຊື່ສິນຄ້າ">
          <input type="number" class="edit-price" value="${p.price || 0}" min="0" step="0.01" placeholder="ລາຄາ">
        </div>
        <div class="prod-meta-row">
          <span class="prod-stock">ຄົງເຫຼືອ ${p.stock} ລະຫັດ</span>
          <div class="prod-actions">
            <button class="icon-btn save-btn" title="ບັນທຶກ">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
            <button class="icon-btn del-btn" title="ລຶບ">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.prod-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.save-btn').addEventListener('click', () => saveProduct(id, row));
    row.querySelector('.del-btn').addEventListener('click', () => deleteProduct(id, row));
  });
}

async function saveProduct(id, row) {
  const btn = row.querySelector('.save-btn');
  const name = row.querySelector('.edit-name').value.trim();
  const price = parseFloat(row.querySelector('.edit-price').value) || 0;
  if (!name) return;

  btn.style.color = 'var(--ink-500)';
  const { error } = await supabaseClient.from('products').update({ name, price }).eq('id', id);
  if (error) {
    console.error(error);
    showToast('ບັນທຶກບໍ່ສຳເລັດ: ' + error.message);
    return;
  }
  showToast('ບັນທຶກສຳເລັດ');
  const p = currentProducts.find(x => x.id === id);
  if (p) { p.name = name; p.price = price; }
}

async function deleteProduct(id, row) {
  if (!confirm('ລຶບສິນຄ້ານີ້ ແລະ ລະຫັດທັງໝົດຂອງມັນ?')) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) {
    showToast('ລຶບບໍ່ສຳເລັດ: ' + error.message);
    return;
  }
  row.remove();
  showToast('ລຶບສຳເລັດແລ້ວ');
  loadProducts();
}

// ---------- toast ນ້ອຍໆ ----------
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- ແຜງເພີ່ມລະຫັດ ----------
function renderCodeProductSelect(products) {
  const select = document.getElementById('codeProductSelect');
  const prevValue = select.value;
  select.innerHTML = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  if (prevValue && products.some(p => p.id === prevValue)) select.value = prevValue;
  renderCodeStockStrip();
}

function renderCodeStockStrip() {
  const select = document.getElementById('codeProductSelect');
  const strip = document.getElementById('codeStockStrip');
  const p = currentProducts.find(x => x.id === select.value);
  if (!p) { strip.innerHTML = ''; return; }
  strip.innerHTML = `
    <div class="ops-chip"><div class="ops-num">${p.stock}</div><div class="ops-label">ລະຫັດຄົງເຫຼືອ</div></div>
    <div class="ops-chip"><div class="ops-num">${formatBaht(p.price)}</div><div class="ops-label">ລາຄາ</div></div>
  `;
}

// ---------- ແຜງຄຳຂໍເຕີມເງິນ ----------
let currentTopupRequests = [];

async function loadTopupRequests() {
  const refreshBtn = document.getElementById('topupRefreshBtn');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  const { data, error } = await supabaseClient
    .from('topup_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (refreshBtn) setTimeout(() => refreshBtn.classList.remove('spinning'), 400);

  if (error) {
    console.error(error);
    document.getElementById('topupList').innerHTML = '<div class="empty-note">ໂຫຼດຂໍ້ມູນຜິດພາດ</div>';
    return;
  }

  currentTopupRequests = data || [];
  appendTopupOpsChip(currentTopupRequests.length);
  renderTopupList(currentTopupRequests);
}

function renderTopupList(requests) {
  const list = document.getElementById('topupList');
  if (!requests.length) {
    list.innerHTML = '<div class="empty-note">ບໍ່ມີຄຳຂໍເຕີມເງິນທີ່ລໍຖ້າກວດສອບ</div>';
    return;
  }

  list.innerHTML = requests.map(r => `
    <div class="topup-card" data-id="${r.id}">
      <div class="topup-head">
        <div>
          <div class="topup-amount">${formatKipAdmin(r.amount)}</div>
          <div class="topup-meta">
            ${r.user_email ? r.user_email : (r.email || 'ບໍ່ມີອີເມວ')}<br>
            <span class="ref">${new Date(r.created_at).toLocaleString('lo-LA')}</span>
          </div>
        </div>
        <span class="topup-status-tag pending">ລໍຖ້າກວດສອບ</span>
      </div>
      ${r.slip_url ? `
        <div class="topup-slip-wrap">
          <img src="${r.slip_url}" alt="ສະລິບໂອນເງິນ" loading="lazy">
          <div class="zoom-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            ຂະຫຍາຍ
          </div>
        </div>` : ''}
      <div class="topup-actions-row">
        <button class="topup-btn approve">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ຢືນຢັນ
        </button>
        <button class="topup-btn reject">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ປະຕິເສດ
        </button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.topup-slip-wrap img').forEach(img => {
    img.addEventListener('click', () => openSlipLightbox(img.src));
  });

  list.querySelectorAll('.topup-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.approve').addEventListener('click', () => decideTopup(id, 'approved', card));
    card.querySelector('.reject').addEventListener('click', () => decideTopup(id, 'rejected', card));
  });
}

async function decideTopup(id, status, card) {
  const btns = card.querySelectorAll('.topup-btn');
  btns.forEach(b => b.disabled = true);

  const { error } = await supabaseClient
    .from('topup_requests')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error(error);
    showToast('ດຳເນີນການບໍ່ສຳເລັດ: ' + error.message);
    btns.forEach(b => b.disabled = false);
    return;
  }

  let toastMsg = status === 'approved' ? 'ຢືນຢັນການເຕີມເງິນສຳເລັດແລ້ວ' : 'ປະຕິເສດຄຳຂໍແລ້ວ';

  if (status === 'approved') {
    const req = currentTopupRequests.find(r => r.id === id);
    if (req && req.user_id) {
      const { error: walletError } = await supabaseClient.rpc('increment_wallet_balance', {
        p_user_id: req.user_id,
        p_amount: req.amount
      });
      if (walletError) {
        console.error(walletError);
        toastMsg = 'ຢືນຢັນແລ້ວ ແຕ່ເຕີມຍອດເງິນເຂົ້າກະເປົາບໍ່ສຳເລັດ: ' + walletError.message;
      } else {
        toastMsg = 'ຢືນຢັນ ແລະ ເຕີມຍອດເງິນເຂົ້າກະເປົາລູກຄ້າສຳເລັດແລ້ວ';
      }
    }
  }

  showToast(toastMsg);
  card.style.transition = 'opacity .2s ease, transform .2s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.96)';
  setTimeout(() => {
    card.remove();
    loadTopupRequests();
  }, 200);
}

function openSlipLightbox(src) {
  const lb = document.getElementById('slipLightbox');
  document.getElementById('slipLightboxImg').src = src;
  lb.classList.add('show');
}

function closeSlipLightbox() {
  document.getElementById('slipLightbox').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await guardAdmin();
  if (!ok) return;

  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

  // ---- tabs ----
  const tabs = document.querySelectorAll('.gx-tab3');
  const slider = document.getElementById('tabSlider3');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
      slider.style.transform = `translateX(${i * 100}%)`;
    });
  });

  // ---- image dropzone ----
  const dropZone = document.getElementById('dropZone');
  const dropZoneText = document.getElementById('dropZoneText');
  const imageInput = document.getElementById('imageInput');
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      dropZone.classList.add('has-image');
      dropZoneText.remove();
      let img = dropZone.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        dropZone.insertBefore(img, imageInput);
      }
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ---- category select: ໂຊວ໌ຊ່ອງພິມໝວດໝູ່ໃໝ່ ເມື່ອເລືອກ "+ ເພີ່ມໝວດໝູ່ໃໝ່" ----
  const pCategorySelect = document.getElementById('pCategorySelect');
  const pCategoryNewWrap = document.getElementById('pCategoryNewWrap');
  pCategorySelect.addEventListener('change', () => {
    pCategoryNewWrap.style.display = pCategorySelect.value === '__new__' ? 'block' : 'none';
    if (pCategorySelect.value === '__new__') {
      document.getElementById('pCategoryNew').focus();
    }
  });

  // ---- add product form ----
  const addForm = document.getElementById('addForm');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addMsg');
    const btn = document.getElementById('addSubmit');
    const name = document.getElementById('pName').value.trim();
    const categorySelect = document.getElementById('pCategorySelect').value;
    const category = (categorySelect === '__new__'
      ? document.getElementById('pCategoryNew').value.trim()
      : categorySelect) || 'ໝວດໝູ່ສິນຄ້າ';
    const price = parseFloat(document.getElementById('pPrice').value) || 0;

    if (!name) return;
    if (categorySelect === '__new__' && !document.getElementById('pCategoryNew').value.trim()) {
      setMsg(msg, 'ກະລຸນາພິມຊື່ໝວດໝູ່ໃໝ່', 'error');
      return;
    }

    setLoading(btn, true);
    setMsg(msg, 'ກຳລັງເພີ່ມສິນຄ້າ...', 'pending');

    let imageUrl = null;
    try {
      if (selectedImageFile) {
        const ext = selectedImageFile.name.split('.').pop();
        const path = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload(path, selectedImageFile);
        if (uploadError) throw uploadError;
        const { data: pub } = supabaseClient.storage.from('product-images').getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const { error: insertError } = await supabaseClient.from('products').insert({
        name, category, price, image_url: imageUrl
      });
      if (insertError) throw insertError;

      setMsg(msg, 'ເພີ່ມສິນຄ້າສຳເລັດແລ້ວ', 'success');
      addForm.reset();
      document.getElementById('pCategoryNewWrap').style.display = 'none';
      document.getElementById('pCategoryNew').value = '';
      selectedImageFile = null;
      dropZone.classList.remove('has-image');
      const img = dropZone.querySelector('img');
      if (img) img.remove();
      if (!document.getElementById('dropZoneText')) {
        const span = document.createElement('span');
        span.id = 'dropZoneText';
        span.textContent = 'ແຕະເພື່ອເລືອກຮູບພາບ';
        dropZone.insertBefore(span, imageInput);
      }
      loadProducts();
    } catch (err) {
      console.error(err);
      setMsg(msg, 'ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ລອງໃໝ່ອີກຄັ້ງ'), 'error');
    } finally {
      setLoading(btn, false);
    }
  });

  // ---- codes ----
  const codeProductSelect = document.getElementById('codeProductSelect');
  codeProductSelect.addEventListener('change', renderCodeStockStrip);

  const codesSubmit = document.getElementById('codesSubmit');
  codesSubmit.addEventListener('click', async () => {
    const msg = document.getElementById('codesMsg');
    const textarea = document.getElementById('codesInput');
    const productId = codeProductSelect.value;
    const lines = textarea.value.split('\n').map(l => l.trim()).filter(Boolean);

    if (!productId) { setMsg(msg, 'ກະລຸນາເລືອກສິນຄ້າກ່ອນ', 'error'); return; }
    if (!lines.length) { setMsg(msg, 'ກະລຸນາໃສ່ລະຫັດຢ່າງໜ້ອຍ 1 ລາຍການ', 'error'); return; }

    setLoading(codesSubmit, true);
    setMsg(msg, 'ກຳລັງບັນທຶກລະຫັດ...', 'pending');

    const rows = lines.map(code => ({ product_id: productId, code }));
    const { error } = await supabaseClient.from('product_codes').insert(rows);

    setLoading(codesSubmit, false);
    if (error) {
      console.error(error);
      setMsg(msg, 'ເກີດຂໍ້ຜິດພາດ: ' + error.message, 'error');
      return;
    }
    setMsg(msg, `ເພີ່ມລະຫັດສຳເລັດ ${lines.length} ລາຍການ`, 'success');
    textarea.value = '';
    loadProducts();
  });

  // ---- top-up requests ----
  const topupRefreshBtn = document.getElementById('topupRefreshBtn');
  if (topupRefreshBtn) topupRefreshBtn.addEventListener('click', loadTopupRequests);

  const slipLightbox = document.getElementById('slipLightbox');
  const slipLightboxClose = document.getElementById('slipLightboxClose');
  if (slipLightboxClose) slipLightboxClose.addEventListener('click', closeSlipLightbox);
  if (slipLightbox) {
    slipLightbox.addEventListener('click', (e) => {
      if (e.target === slipLightbox) closeSlipLightbox();
    });
  }

  await loadProducts();
  await loadTopupRequests();
});
