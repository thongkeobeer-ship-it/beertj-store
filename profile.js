// ============================================
// ໜ້າ "ບັນຊີຂອງຂ້ອຍ" — ຂໍ້ມູນທັງໝົດຢູ່ໜ້ານີ້ແມ່ນຂໍ້ມູນຈິງຈາກ Supabase
// (ບໍ່ມີການໃສ່ຕົວເລກຄ້າງໄວ້ / ບໍ່ມີ referral ຫຼື point ເພາະຮ້ານນີ້ຍັງບໍ່ມີລະບົບນັ້ນ)
// ============================================

function formatBaht(n) {
  return '฿' + Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatJoinDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return ''; }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

async function getOrderStats(userId) {
  // ຈຳນວນຄຳສັ່ງຊື້ທັງໝົດ + ຍອດໃຊ້ຈ່າຍລວມ (ນັບສະເພາະທີ່ status = paid) — ຂໍ້ມູນຈິງຈາກຕາຕະລາງ orders
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('total_price, status')
      .eq('user_id', userId);
    if (error) throw error;
    const list = data || [];
    const totalOrders = list.length;
    const totalSpent = list
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    return { totalOrders, totalSpent };
  } catch (err) {
    console.error('ດຶງສະຖິຕິຄຳສັ່ງຊື້ບໍ່ສຳເລັດ', err);
    return { totalOrders: null, totalSpent: null };
  }
}

function renderProfile(user, admin, balance, stats) {
  const container = document.getElementById('profileContent');

  const meta = user.user_metadata || {};
  const displayName = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'ຜູ້ໃຊ້');
  const avatarUrl = meta.avatar_url || meta.picture || null;
  const initial = displayName.charAt(0).toUpperCase();
  const joined = user.created_at ? formatJoinDate(user.created_at) : '';

  const avatarHtml = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" referrerpolicy="no-referrer">`
    : initial;

  const badgeHtml = admin
    ? `<span class="pf-badge is-admin"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5Z"/></svg> ແອດມິນ</span>`
    : `<span class="pf-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> ສະມາຊິກ</span>`;

  const ordersNumHtml = stats.totalOrders === null ? '—' : stats.totalOrders.toLocaleString('th-TH');
  const spentHtml = stats.totalSpent === null ? '—' : formatBaht(stats.totalSpent);

  container.innerHTML = `
    <div class="pf-card pf-head">
      <div class="pf-avatar-wrap">
        <div class="pf-avatar">${avatarHtml}</div>
      </div>
      <div class="pf-name">${escapeHtml(displayName)}</div>
      <div class="pf-email">${escapeHtml(user.email || '')}</div>
      ${badgeHtml}
      <div class="pf-divider"></div>
      <div class="pf-joined">${joined ? 'ເປັນສະມາຊິກເມື່ອ ' + joined : ''}</div>
    </div>

    <div class="pf-card">
      <div class="pf-wallet-label">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 15h.01"/></svg>
        ຍອດເງິນຄົງເຫຼືອ
      </div>
      <div class="pf-wallet-amount" id="pfWalletAmount">${formatBaht(balance)}</div>
      <div class="pf-wallet-actions">
        <a class="pf-wallet-btn" href="topup.html">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ເຕີມເງິນ
        </a>
        <a class="pf-wallet-btn outline" href="topup.html">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
          ປະຫວັດ
        </a>
      </div>
    </div>

    <div class="pf-stat-grid">
      <div class="pf-stat-row">
        <div class="pf-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L22 6H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
        </div>
        <div>
          <div class="pf-stat-num">${ordersNumHtml}</div>
          <div class="pf-stat-label">ຄຳສັ່ງຊື້ທັງໝົດ</div>
        </div>
      </div>
      <div class="pf-stat-row">
        <div class="pf-stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <div>
          <div class="pf-stat-num">${spentHtml}</div>
          <div class="pf-stat-label">ຍອດໃຊ້ຈ່າຍສະສົມ</div>
        </div>
      </div>
    </div>

    <div class="pf-menu-card">
      <a class="pf-menu-row" href="orders.html">
        <svg class="pf-menu-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
        ສະຖານະຄຳສັ່ງຊື້
        <svg class="pf-menu-caret" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
      <a class="pf-menu-row" href="topup.html">
        <svg class="pf-menu-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        ປະຫວັດການເຕີມເງິນ
        <svg class="pf-menu-caret" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </a>
      <button type="button" class="pf-menu-row" id="pfChangePwToggle">
        <svg class="pf-menu-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        ປ່ຽນລະຫັດຜ່ານ
        <svg class="pf-menu-caret" id="pfPwCaret" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <div class="pf-pw-panel" id="pfPwPanel">
        <form id="pfPwForm">
          <div class="pf-pw-field">
            <label for="pfNewPassword">ລະຫັດຜ່ານໃໝ່ (ຢ່າງໜ້ອຍ 6 ໂຕອັກສອນ)</label>
            <input type="password" id="pfNewPassword" required minlength="6" placeholder="••••••••">
          </div>
          <div class="pf-pw-field">
            <label for="pfNewPassword2">ຢືນຢັນລະຫັດຜ່ານໃໝ່</label>
            <input type="password" id="pfNewPassword2" required minlength="6" placeholder="••••••••">
          </div>
          <button type="submit" class="pf-pw-submit" id="pfPwSubmit">ບັນທຶກລະຫັດຜ່ານໃໝ່</button>
          <div class="pf-pw-msg" id="pfPwMsg"></div>
        </form>
      </div>
      <button type="button" class="pf-menu-row danger" id="pfLogoutBtn">
        <svg class="pf-menu-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        ອອກຈາກລະບົບ
      </button>
    </div>
  `;

  // ---- change password toggle ----
  const pwToggle = document.getElementById('pfChangePwToggle');
  const pwPanel = document.getElementById('pfPwPanel');
  const pwCaret = document.getElementById('pfPwCaret');
  pwToggle.addEventListener('click', () => {
    pwPanel.classList.toggle('open');
    pwCaret.style.transform = pwPanel.classList.contains('open') ? 'rotate(90deg)' : 'rotate(0deg)';
  });

  document.getElementById('pfPwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('pfPwMsg');
    const btn = document.getElementById('pfPwSubmit');
    const p1 = document.getElementById('pfNewPassword').value;
    const p2 = document.getElementById('pfNewPassword2').value;
    msg.classList.remove('error', 'success');
    if (p1 !== p2) {
      msg.textContent = 'ລະຫັດຜ່ານທັງສອງຊ່ອງບໍ່ກົງກັນ';
      msg.classList.add('error');
      return;
    }
    btn.disabled = true;
    msg.textContent = 'ກຳລັງບັນທຶກ...';
    const { error } = await supabaseClient.auth.updateUser({ password: p1 });
    btn.disabled = false;
    if (error) {
      msg.textContent = 'ບໍ່ສຳເລັດ: ' + (error.message || 'ມີບັນຫາເກີດຂຶ້ນ');
      msg.classList.add('error');
    } else {
      msg.textContent = 'ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ';
      msg.classList.add('success');
      document.getElementById('pfPwForm').reset();
    }
  });

  // ---- logout ----
  document.getElementById('pfLogoutBtn').addEventListener('click', signOut);
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html?redirect=profile.html';
    return;
  }

  const [admin, balance, stats] = await Promise.all([
    isAdmin(),
    getWalletBalance(user.id),
    getOrderStats(user.id)
  ]);

  renderProfile(user, admin, balance, stats);
});
