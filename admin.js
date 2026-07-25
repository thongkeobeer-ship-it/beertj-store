// ============================================
// ໜ້າຄວບຄຸມແອດມິນ — ເພີ່ມ/ແກ້ໄຂສິນຄ້າ ແລະ ເຕີມລະຫັດ
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
  return withStock;
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

  // ---- add product form ----
  const addForm = document.getElementById('addForm');
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('addMsg');
    const btn = document.getElementById('addSubmit');
    const name = document.getElementById('pName').value.trim();
    const category = document.getElementById('pCategory').value.trim() || 'ໝວດໝູ່ສິນຄ້າ';
    const price = parseFloat(document.getElementById('pPrice').value) || 0;

    if (!name) return;

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

  await loadProducts();
});
