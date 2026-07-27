// ============================================
// ໜ້າຄວບຄຸມແອດມິນ — ເພີ່ມ/ແກ້ໄຂສິນຄ້າ, ເຕີມລະຫັດ ແລະ ຄຳຂໍເຕີມເງິນ
// ============================================

let currentProducts = [];
let selectedImageFile = null;
let currentSiteSettings = {};
let selectedLogoFile = null;
let selectedQrFile = null;

// ຕົວເລືອກໄລຍະເວລາທີ່ໃຫ້ເລືອກຕອນສ້າງສິນຄ້າ
const DURATION_OPTIONS = ['12ຊມ', '1ວັນ', '2ວັນ', '3ວັນ', '4ວັນ', '5ວັນ', '6ວັນ', '7ວັນ', '10ວັນ', '20ວັນ', '30ວັນ'];

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

function formatKipAdmin(n) {
  return Number(n || 0).toLocaleString('en-US') + ' ກີບ';
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

  const { data: allDurations, error: durError } = await supabaseClient
    .from('product_durations')
    .select('*')
    .order('sort_order', { ascending: true });

  if (durError) console.error(durError);

  const withStock = await Promise.all((products || []).map(async (p) => {
    const { data: stock } = await supabaseClient.rpc('product_stock', { p_product_id: p.id });
    const ownDurations = (allDurations || []).filter(d => d.product_id === p.id);
    const durationsWithStock = await Promise.all(ownDurations.map(async (d) => {
      const { data: dStock } = await supabaseClient.rpc('product_duration_stock', { p_duration_id: d.id });
      return { ...d, stock: dStock ?? 0 };
    }));
    return { ...p, stock: stock ?? 0, durations: durationsWithStock };
  }));

  currentProducts = withStock;
  const totalStock = withStock.reduce((sum, p) => sum + (p.stock || 0), 0);
  renderOpsStrip(withStock, totalStock);
  renderManageList(withStock);
  renderCodeProductSelect(withStock);
  renderCategoryOptions(withStock);
  return withStock;
}

// ---------- ຕົວເລືອກໝວດໝູ່ (ຊື່ໝວດໝູ່ຫຼັກຈາກການຕັ້ງຄ່າຮ້ານ + ໝວດໝູ່ອື່ນທີ່ມີໃນສິນຄ້າຢູ່ແລ້ວ) ----------
function getCurrentCategoryNames() {
  const s = currentSiteSettings || {};
  return [
    s.category_1_name || 'ໝວດໝູ່ 1',
    s.category_2_name || 'ໝວດໝູ່ 2',
    s.category_3_name || 'ໝວດໝູ່ 3'
  ];
}

function renderCategoryOptions(products) {
  const select = document.getElementById('pCategorySelect');
  if (!select) return;

  const fromProducts = products.map(p => (p.category || '').trim()).filter(Boolean);
  const categories = [...new Set([...getCurrentCategoryNames(), ...fromProducts])]
    .sort((a, b) => a.localeCompare(b, 'th'));

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
    <div class="prod-row ${p.archived ? 'is-archived' : ''}" data-id="${p.id}">
      <img class="prod-thumb" src="${p.image_url || ''}" onerror="this.style.opacity=0" alt="">
      <div class="prod-fields">
        ${p.archived ? '<div class="archived-tag">ເຊື່ອງໄວ້ — ບໍ່ສະແດງໃນໜ້າຮ້ານ</div>' : ''}
        <div class="gx-row2">
          <input type="text" class="edit-name" value="${(p.name || '').replace(/"/g, '&quot;')}" placeholder="ຊື່ສິນຄ້າ">
          <input type="number" class="edit-price" value="${p.price || 0}" min="0" step="0.01" placeholder="ລາຄາ">
        </div>
        <div class="prod-meta-row">
          <span class="prod-stock">${p.duration_enabled ? 'ມີໄລຍະເວລາ' : `ຄົງເຫຼືອ ${p.stock} ລະຫັດ`}</span>
          <div class="prod-actions">
            <button class="icon-btn save-btn" title="ບັນທຶກ">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
            <button class="icon-btn del-btn" title="${p.archived ? 'ນຳກັບມາສະແດງ' : 'ເອົາອອກຈາກໜ້າຮ້ານ'}">
              ${p.archived ? `
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              ` : `
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              `}
            </button>
          </div>
        </div>
        ${p.duration_enabled && p.durations && p.durations.length ? `
        <div class="prod-duration-list">
          ${p.durations.map(d => `<span class="prod-duration-chip">${d.label} • ${formatKipAdmin(d.price)} • ຄົງເຫຼືອ ${d.stock}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.prod-row').forEach(row => {
    const id = row.dataset.id;
    row.querySelector('.save-btn').addEventListener('click', () => saveProduct(id, row));
    row.querySelector('.del-btn').addEventListener('click', () => toggleArchiveProduct(id, row));
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

// ສິນຄ້າທີ່ເຄີຍຖືກສັ່ງຊື້ໄປແລ້ວ ຈະລຶບຖາວອນອອກຈາກຕາຕະລາງບໍ່ໄດ້
// (ຈະຊົນກັບ foreign key ຂອງຕາຕະລາງ orders) — ຈຶ່ງໃຊ້ "ເຊື່ອງ/ນຳກັບມາ" ແທນການລຶບຖາວອນ
// ເພື່ອຮັກສາປະຫວັດການສັ່ງຊື້ຂອງລູກຄ້າໄວ້ຄົບຖ້ວນ
async function toggleArchiveProduct(id, row) {
  const p = currentProducts.find(x => x.id === id);
  if (!p) return;

  const nextArchived = !p.archived;
  const confirmMsg = nextArchived
    ? 'ເອົາສິນຄ້ານີ້ອອກຈາກໜ້າຮ້ານ? (ຍັງບໍ່ລຶບຖາວອນ, ປະຫວັດການສັ່ງຊື້ເກົ່າຍັງຄົງຢູ່ ແລະ ສາມາດນຳກັບມາໄດ້ພາຍຫຼັງ)'
    : 'ນຳສິນຄ້ານີ້ກັບມາສະແດງໃນໜ້າຮ້ານ?';
  if (!confirm(confirmMsg)) return;

  const { error } = await supabaseClient
    .from('products')
    .update({ archived: nextArchived })
    .eq('id', id);

  if (error) {
    console.error(error);
    showToast('ດຳເນີນການບໍ່ສຳເລັດ: ' + error.message);
    return;
  }

  showToast(nextArchived ? 'ເອົາອອກຈາກໜ້າຮ້ານແລ້ວ' : 'ນຳກັບມາສະແດງແລ້ວ');
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
  const activeProducts = products.filter(p => !p.archived);
  select.innerHTML = activeProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  if (prevValue && activeProducts.some(p => p.id === prevValue)) select.value = prevValue;
  renderCodeStockStrip();
}

function renderCodeStockStrip() {
  const select = document.getElementById('codeProductSelect');
  const strip = document.getElementById('codeStockStrip');
  const durationWrap = document.getElementById('codeDurationWrap');
  const durationSelect = document.getElementById('codeDurationSelect');
  const p = currentProducts.find(x => x.id === select.value);
  if (!p) { strip.innerHTML = ''; durationWrap.style.display = 'none'; return; }

  if (p.duration_enabled) {
    durationWrap.style.display = 'block';
    const prevDur = durationSelect.value;
    durationSelect.innerHTML = (p.durations || [])
      .map(d => `<option value="${d.id}">${d.label} • ${formatKipAdmin(d.price)} • ຄົງເຫຼືອ ${d.stock}</option>`)
      .join('') || '<option value="">ຍັງບໍ່ມີຕົວເລືອກໄລຍະເວລາ — ໄປສ້າງທີ່ແຖບ "ເພີ່ມສິນຄ້າ" ກ່ອນ</option>';
    if (prevDur && (p.durations || []).some(d => d.id === prevDur)) durationSelect.value = prevDur;

    const chosen = (p.durations || []).find(d => d.id === durationSelect.value);
    strip.innerHTML = chosen ? `
      <div class="ops-chip"><div class="ops-num">${chosen.stock}</div><div class="ops-label">ລະຫັດຄົງເຫຼືອ (${chosen.label})</div></div>
      <div class="ops-chip"><div class="ops-num">${formatKipAdmin(chosen.price)}</div><div class="ops-label">ລາຄາ</div></div>
    ` : '';
  } else {
    durationWrap.style.display = 'none';
    strip.innerHTML = `
      <div class="ops-chip"><div class="ops-num">${p.stock}</div><div class="ops-label">ລະຫັດຄົງເຫຼືອ</div></div>
      <div class="ops-chip"><div class="ops-num">${formatKipAdmin(p.price)}</div><div class="ops-label">ລາຄາ</div></div>
    `;
  }
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

// ============================================
// ຕັ້ງຄ່າຮ້ານ — ຊື່ຮ້ານ / ຄຳອະທິບາຍ / ຂໍ້ຄວາມປະກາດ / ຊື່ໝວດໝູ່ / ໂລໂກ້ / QR
// ຕ້ອງແລ່ນ site_settings_setup.sql ໃນ Supabase ກ່ອນ (ສ້າງຕາຕະລາງ site_settings ແລະ bucket site-assets)
// ============================================
const SITE_SETTINGS_TABLE = 'site_settings';
const SITE_SETTINGS_ID = 1;

// ຖ້າຍັງບໍ່ມີແຖວການຕັ້ງຄ່າ (ຄັ້ງທຳອິດ) ໃຫ້ສ້າງແຖວຄ່າຕັ້ງຕົ້ນຂຶ້ນມາກ່ອນ
async function ensureSiteSettingsRow() {
  const { data, error } = await supabaseClient
    .from(SITE_SETTINGS_TABLE)
    .select('id')
    .eq('id', SITE_SETTINGS_ID)
    .maybeSingle();
  if (!error && !data) {
    await supabaseClient.from(SITE_SETTINGS_TABLE).insert({ id: SITE_SETTINGS_ID });
  }
}

function fillDropzonePreview(zoneId, textId, inputId, url) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input || !url) return;
  zone.classList.add('has-image');
  const textEl = document.getElementById(textId);
  if (textEl) textEl.remove();
  let img = zone.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    zone.insertBefore(img, input);
  }
  img.src = url;
}

function loadSiteSettingsIntoForm(settings) {
  const nameInput = document.getElementById('settingStoreName');
  const taglineInput = document.getElementById('settingTagline');
  const announceInput = document.getElementById('settingAnnouncement');
  const cat1Input = document.getElementById('settingCat1');
  const cat2Input = document.getElementById('settingCat2');
  const cat3Input = document.getElementById('settingCat3');
  const socialFacebookInput = document.getElementById('settingSocialFacebook');
  const socialDiscordInput = document.getElementById('settingSocialDiscord');
  const socialLineInput = document.getElementById('settingSocialLine');
  const socialTelegramInput = document.getElementById('settingSocialTelegram');
  const socialWhatsappInput = document.getElementById('settingSocialWhatsapp');

  if (nameInput && document.activeElement !== nameInput) nameInput.value = settings.store_name || '';
  if (taglineInput && document.activeElement !== taglineInput) taglineInput.value = settings.tagline || '';
  if (announceInput && document.activeElement !== announceInput) announceInput.value = settings.announcement_text || '';
  if (cat1Input && document.activeElement !== cat1Input) cat1Input.value = settings.category_1_name || 'ໝວດໝູ່ 1';
  if (cat2Input && document.activeElement !== cat2Input) cat2Input.value = settings.category_2_name || 'ໝວດໝູ່ 2';
  if (cat3Input && document.activeElement !== cat3Input) cat3Input.value = settings.category_3_name || 'ໝວດໝູ່ 3';
  if (socialFacebookInput && document.activeElement !== socialFacebookInput) socialFacebookInput.value = settings.social_facebook || '';
  if (socialDiscordInput && document.activeElement !== socialDiscordInput) socialDiscordInput.value = settings.social_discord || '';
  if (socialLineInput && document.activeElement !== socialLineInput) socialLineInput.value = settings.social_line || '';
  if (socialTelegramInput && document.activeElement !== socialTelegramInput) socialTelegramInput.value = settings.social_telegram || '';
  if (socialWhatsappInput && document.activeElement !== socialWhatsappInput) socialWhatsappInput.value = settings.social_whatsapp || '';

  fillDropzonePreview('logoDropZone', 'logoDropZoneText', 'logoInput', settings.logo_url);
  fillDropzonePreview('qrDropZone', 'qrDropZoneText', 'qrInput', settings.qr_url);
}

async function loadSiteSettingsAdmin() {
  try {
    const { data, error } = await supabaseClient
      .from(SITE_SETTINGS_TABLE)
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle();
    if (error) throw error;
    currentSiteSettings = data || {};
    loadSiteSettingsIntoForm(currentSiteSettings);
    renderCategoryOptions(currentProducts);
  } catch (err) {
    console.error('ໂຫຼດການຕັ້ງຄ່າຮ້ານບໍ່ສຳເລັດ', err);
  }
}

async function saveSiteSettingsFields(fields, btn, msgEl, successText) {
  setLoading(btn, true);
  setMsg(msgEl, 'ກຳລັງບັນທຶກ...', 'pending');
  try {
    await ensureSiteSettingsRow();
    const { error } = await supabaseClient
      .from(SITE_SETTINGS_TABLE)
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', SITE_SETTINGS_ID);
    if (error) throw error;
    setMsg(msgEl, successText, 'success');
    await loadSiteSettingsAdmin();
  } catch (err) {
    console.error(err);
    setMsg(msgEl, 'ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ລອງໃໝ່ອີກຄັ້ງ'), 'error');
  } finally {
    setLoading(btn, false);
  }
}

async function uploadSiteAsset(file, prefix) {
  const ext = file.name.split('.').pop();
  const path = `${prefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabaseClient.storage.from('site-assets').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: pub } = supabaseClient.storage.from('site-assets').getPublicUrl(path);
  return pub.publicUrl;
}

function setupSiteImageDropzone(zoneId, textId, inputId, onSelected) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  if (!zone || !input) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    onSelected(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      zone.classList.add('has-image');
      const textEl = document.getElementById(textId);
      if (textEl) textEl.remove();
      let img = zone.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        zone.insertBefore(img, input);
      }
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function initSiteSettingsPanel() {
  setupSiteImageDropzone('logoDropZone', 'logoDropZoneText', 'logoInput', (f) => { selectedLogoFile = f; });
  setupSiteImageDropzone('qrDropZone', 'qrDropZoneText', 'qrInput', (f) => { selectedQrFile = f; });

  const saveStoreNameBtn = document.getElementById('saveStoreNameBtn');
  if (saveStoreNameBtn) {
    saveStoreNameBtn.addEventListener('click', () => {
      const msg = document.getElementById('storeNameMsg');
      const name = document.getElementById('settingStoreName').value.trim();
      if (!name) { setMsg(msg, 'ກະລຸນາໃສ່ຊື່ຮ້ານ', 'error'); return; }
      saveSiteSettingsFields(
        { store_name: name }, saveStoreNameBtn, msg,
        'ບັນທຶກຊື່ຮ້ານສຳເລັດແລ້ວ — ໜ້າຮ້ານຈິງຈະອັບເດດອັດຕະໂນມັດ'
      );
    });
  }

  const saveTaglineBtn = document.getElementById('saveTaglineBtn');
  if (saveTaglineBtn) {
    saveTaglineBtn.addEventListener('click', () => {
      const msg = document.getElementById('taglineMsg');
      const tagline = document.getElementById('settingTagline').value.trim();
      saveSiteSettingsFields({ tagline }, saveTaglineBtn, msg, 'ບັນທຶກຄຳອະທິບາຍສຳເລັດແລ້ວ');
    });
  }

  const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');
  if (saveAnnouncementBtn) {
    saveAnnouncementBtn.addEventListener('click', () => {
      const msg = document.getElementById('announcementMsg');
      const text = document.getElementById('settingAnnouncement').value.trim();
      if (!text) { setMsg(msg, 'ກະລຸນາໃສ່ຂໍ້ຄວາມປະກາດ', 'error'); return; }
      saveSiteSettingsFields({ announcement_text: text }, saveAnnouncementBtn, msg, 'ບັນທຶກຂໍ້ຄວາມປະກາດສຳເລັດແລ້ວ');
    });
  }

  const saveCategoriesBtn = document.getElementById('saveCategoriesBtn');
  if (saveCategoriesBtn) {
    saveCategoriesBtn.addEventListener('click', async () => {
      const msg = document.getElementById('categoriesMsg');
      const newCat1 = document.getElementById('settingCat1').value.trim() || 'ໝວດໝູ່ 1';
      const newCat2 = document.getElementById('settingCat2').value.trim() || 'ໝວດໝູ່ 2';
      const newCat3 = document.getElementById('settingCat3').value.trim() || 'ໝວດໝູ່ 3';

      setLoading(saveCategoriesBtn, true);
      setMsg(msg, 'ກຳລັງບັນທຶກ ແລະ ຍ້າຍສິນຄ້າໄປໝວດໝູ່ໃໝ່...', 'pending');
      try {
        await ensureSiteSettingsRow();
        const oldCat1 = currentSiteSettings.category_1_name || 'ໝວດໝູ່ 1';
        const oldCat2 = currentSiteSettings.category_2_name || 'ໝວດໝູ່ 2';
        const oldCat3 = currentSiteSettings.category_3_name || 'ໝວດໝູ່ 3';

        const renames = [[oldCat1, newCat1], [oldCat2, newCat2], [oldCat3, newCat3]];
        for (const [oldName, newName] of renames) {
          if (oldName !== newName) {
            const { error: catError } = await supabaseClient
              .from('products')
              .update({ category: newName })
              .eq('category', oldName);
            if (catError) throw catError;
          }
        }

        const { error } = await supabaseClient
          .from(SITE_SETTINGS_TABLE)
          .update({
            category_1_name: newCat1,
            category_2_name: newCat2,
            category_3_name: newCat3,
            updated_at: new Date().toISOString()
          })
          .eq('id', SITE_SETTINGS_ID);
        if (error) throw error;

        setMsg(msg, 'ປ່ຽນຊື່ໝວດໝູ່ສຳເລັດແລ້ວ — ສິນຄ້າເກົ່າຖືກຍ້າຍໄປໝວດໃໝ່ໃຫ້ອັດຕະໂນມັດ', 'success');
        await loadSiteSettingsAdmin();
        await loadProducts();
      } catch (err) {
        console.error(err);
        setMsg(msg, 'ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ລອງໃໝ່ອີກຄັ້ງ'), 'error');
      } finally {
        setLoading(saveCategoriesBtn, false);
      }
    });
  }

  const saveSocialLinksBtn = document.getElementById('saveSocialLinksBtn');
  if (saveSocialLinksBtn) {
    saveSocialLinksBtn.addEventListener('click', () => {
      const msg = document.getElementById('socialLinksMsg');
      const facebook = document.getElementById('settingSocialFacebook').value.trim();
      const discord = document.getElementById('settingSocialDiscord').value.trim();
      const line = document.getElementById('settingSocialLine').value.trim();
      const telegram = document.getElementById('settingSocialTelegram').value.trim();
      const whatsapp = document.getElementById('settingSocialWhatsapp').value.trim();
      saveSiteSettingsFields(
        {
          social_facebook: facebook || null,
          social_discord: discord || null,
          social_line: line || null,
          social_telegram: telegram || null,
          social_whatsapp: whatsapp || null
        },
        saveSocialLinksBtn, msg,
        'ບັນທຶກຊ່ອງທາງໂຊເຊียลສຳເລັດແລ້ວ — ໜ້າຮ້ານຈິງຈະອັບເດດອັດຕະໂນມັດ'
      );
    });
  }

  const saveLogoBtn = document.getElementById('saveLogoBtn');
  if (saveLogoBtn) {
    saveLogoBtn.addEventListener('click', async () => {
      const msg = document.getElementById('logoMsg');
      if (!selectedLogoFile) { setMsg(msg, 'ກະລຸນາເລືອກຮູບໂລໂກ້ກ່ອນ', 'error'); return; }
      setLoading(saveLogoBtn, true);
      setMsg(msg, 'ກຳລັງອັບໂຫຼດ...', 'pending');
      try {
        const url = await uploadSiteAsset(selectedLogoFile, 'logo');
        await ensureSiteSettingsRow();
        const { error } = await supabaseClient
          .from(SITE_SETTINGS_TABLE)
          .update({ logo_url: url, updated_at: new Date().toISOString() })
          .eq('id', SITE_SETTINGS_ID);
        if (error) throw error;
        setMsg(msg, 'ປ່ຽນໂລໂກ້ສຳເລັດແລ້ວ', 'success');
        selectedLogoFile = null;
        await loadSiteSettingsAdmin();
      } catch (err) {
        console.error(err);
        setMsg(msg, 'ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ລອງໃໝ່ອີກຄັ້ງ'), 'error');
      } finally {
        setLoading(saveLogoBtn, false);
      }
    });
  }

  const saveQrBtn = document.getElementById('saveQrBtn');
  if (saveQrBtn) {
    saveQrBtn.addEventListener('click', async () => {
      const msg = document.getElementById('qrMsg');
      if (!selectedQrFile) { setMsg(msg, 'ກະລຸນາເລືອກຮູບ QR ກ່ອນ', 'error'); return; }
      setLoading(saveQrBtn, true);
      setMsg(msg, 'ກຳລັງອັບໂຫຼດ...', 'pending');
      try {
        const url = await uploadSiteAsset(selectedQrFile, 'qr');
        await ensureSiteSettingsRow();
        const { error } = await supabaseClient
          .from(SITE_SETTINGS_TABLE)
          .update({ qr_url: url, updated_at: new Date().toISOString() })
          .eq('id', SITE_SETTINGS_ID);
        if (error) throw error;
        setMsg(msg, 'ປ່ຽນ QR ໂອນເງິນສຳເລັດແລ້ວ', 'success');
        selectedQrFile = null;
        await loadSiteSettingsAdmin();
      } catch (err) {
        console.error(err);
        setMsg(msg, 'ເກີດຂໍ້ຜິດພາດ: ' + (err.message || 'ລອງໃໝ່ອີກຄັ້ງ'), 'error');
      } finally {
        setLoading(saveQrBtn, false);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await guardAdmin();
  if (!ok) return;

  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

  // ---- tabs (ເລື່ອນຊ້າຍ-ຂວາໄດ້, ຮອງຮັບຈຳນວນແທັບບໍ່ຈຳກັດ) ----
  const tabs = document.querySelectorAll('.gx-tab3');
  const tabsWrap = document.querySelector('.gx-tabs3');
  const slider = document.getElementById('tabSlider3');
  const panels = document.querySelectorAll('.panel');

  function positionTabSlider(tab) {
    if (!tab || !slider) return;
    slider.style.width = tab.offsetWidth + 'px';
    slider.style.transform = `translateX(${tab.offsetLeft - 4}px)`;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.panel).classList.add('active');
      positionTabSlider(tab);
      tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });

  requestAnimationFrame(() => positionTabSlider(document.querySelector('.gx-tab3.active')));
  window.addEventListener('resize', () => positionTabSlider(document.querySelector('.gx-tab3.active')));

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

  // ---- duration options builder (12ຊມ / 1ວັນ ... 30ວັນ) ----
  const durationOptionsList = document.getElementById('durationOptionsList');
  durationOptionsList.innerHTML = DURATION_OPTIONS.map((label, i) => `
    <div class="duration-opt-row" data-label="${label}">
      <label>
        <input type="checkbox" class="dur-check" data-index="${i}">
        ${label}
      </label>
      <input type="number" class="dur-price" min="0" step="0.01" placeholder="ລາຄາ (ກີບ)" style="display:none;">
    </div>
  `).join('');

  durationOptionsList.querySelectorAll('.dur-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const priceInput = cb.closest('.duration-opt-row').querySelector('.dur-price');
      priceInput.style.display = cb.checked ? 'block' : 'none';
      if (cb.checked) priceInput.focus();
    });
  });

  const pDurationEnabled = document.getElementById('pDurationEnabled');
  const durationOptionsWrap = document.getElementById('durationOptionsWrap');
  const basePriceField = document.getElementById('basePriceField');
  pDurationEnabled.addEventListener('change', () => {
    durationOptionsWrap.style.display = pDurationEnabled.checked ? 'block' : 'none';
    basePriceField.style.display = pDurationEnabled.checked ? 'none' : 'block';
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
    const durationEnabled = document.getElementById('pDurationEnabled').checked;

    let durationRows = [];
    if (durationEnabled) {
      durationOptionsList.querySelectorAll('.duration-opt-row').forEach(row => {
        const cb = row.querySelector('.dur-check');
        if (!cb.checked) return;
        const label = row.dataset.label;
        const durPrice = parseFloat(row.querySelector('.dur-price').value);
        durationRows.push({ label, price: isNaN(durPrice) ? 0 : durPrice });
      });
    }

    if (!name) return;
    if (categorySelect === '__new__' && !document.getElementById('pCategoryNew').value.trim()) {
      setMsg(msg, 'ກະລຸນາພິມຊື່ໝວດໝູ່ໃໝ່', 'error');
      return;
    }
    if (durationEnabled && !durationRows.length) {
      setMsg(msg, 'ກະລຸນາເລືອກຢ່າງໜ້ອຍ 1 ໄລຍະເວລາ ແລະ ຕັ້ງລາຄາ', 'error');
      return;
    }
    if (!durationEnabled && document.getElementById('pPrice').value.trim() === '') {
      setMsg(msg, 'ກະລຸນາໃສ່ລາຄາສິນຄ້າ', 'error');
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

      const { data: newProduct, error: insertError } = await supabaseClient
        .from('products')
        .insert({
          name, category,
          price: durationEnabled ? 0 : price,
          image_url: imageUrl,
          duration_enabled: durationEnabled
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (durationEnabled && durationRows.length) {
        const rows = durationRows.map((d, i) => ({
          product_id: newProduct.id,
          label: d.label,
          price: d.price,
          sort_order: i
        }));
        const { error: durInsertError } = await supabaseClient.from('product_durations').insert(rows);
        if (durInsertError) throw durInsertError;
      }

      setMsg(msg, 'ເພີ່ມສິນຄ້າສຳເລັດແລ້ວ', 'success');
      addForm.reset();
      document.getElementById('pCategoryNewWrap').style.display = 'none';
      document.getElementById('pCategoryNew').value = '';
      pDurationEnabled.checked = false;
      durationOptionsWrap.style.display = 'none';
      basePriceField.style.display = 'block';
      durationOptionsList.querySelectorAll('.dur-price').forEach(inp => { inp.style.display = 'none'; inp.value = ''; });
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

  const codeDurationSelect = document.getElementById('codeDurationSelect');
  codeDurationSelect.addEventListener('change', renderCodeStockStrip);

  const codesSubmit = document.getElementById('codesSubmit');
  codesSubmit.addEventListener('click', async () => {
    const msg = document.getElementById('codesMsg');
    const textarea = document.getElementById('codesInput');
    const productId = codeProductSelect.value;
    const lines = textarea.value.split('\n').map(l => l.trim()).filter(Boolean);
    const product = currentProducts.find(p => p.id === productId);
    const durationId = product && product.duration_enabled ? codeDurationSelect.value : null;

    if (!productId) { setMsg(msg, 'ກະລຸນາເລືອກສິນຄ້າກ່ອນ', 'error'); return; }
    if (product && product.duration_enabled && !durationId) {
      setMsg(msg, 'ກະລຸນາເລືອກໄລຍະເວລາກ່ອນ (ຫຼືໄປສ້າງຕົວເລືອກໄລຍະເວລາທີ່ແຖບ "ເພີ່ມສິນຄ້າ" ກ່ອນ)', 'error');
      return;
    }
    if (!lines.length) { setMsg(msg, 'ກະລຸນາໃສ່ລະຫັດຢ່າງໜ້ອຍ 1 ລາຍການ', 'error'); return; }

    setLoading(codesSubmit, true);
    setMsg(msg, 'ກຳລັງບັນທຶກລະຫັດ...', 'pending');

    const rows = lines.map(code => ({ product_id: productId, code, duration_id: durationId || null }));
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

  initSiteSettingsPanel();

  await loadSiteSettingsAdmin();
  await loadProducts();
  await loadTopupRequests();
});
