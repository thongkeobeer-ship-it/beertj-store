// ============================================
// ລະບົບສະມາຊິກ (Supabase Auth) — ໃຊ້ຮ່ວມກັນທຸກໜ້າ
// ຕ້ອງ include ຕາມລຳດັບ: supabase-js CDN -> config.js -> auth.js
// ============================================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// ການແຈ້ງເຕືອນໄປຫາ Discord
// ໝາຍເຫດ: webhook URL ຖືກຍ້າຍໄປເກັບເປັນ secret ໃນ Worker (env.DISCORD_WEBHOOK_URL)
// ຝັ່ງ client ຈະຍິງໄປ /api/notify-discord (same-origin) ແທນ ບໍ່ໃຫ້ webhook URL ຫຼຸດອອກມາໃນໜ້າເວັບ
// ============================================
async function sendDiscordNotification(content, embed) {
  try {
    const body = { content };
    if (embed) body.embeds = [embed];
    await fetch('/api/notify-discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('ສົ່ງແຈ້ງເຕືອນ Discord ບໍ່ສຳເລັດ', err);
  }
}

// ກັນການແຈ້ງເຕືອນຊ້ຳກັນຫຼາຍຄັ້ງໃນ session ດຽວກັນ (ຕໍ່ user)
function markDiscordNotified(userId) {
  try { sessionStorage.setItem('discordNotifiedUserId', userId); } catch (e) {}
}
function alreadyDiscordNotified(userId) {
  try { return sessionStorage.getItem('discordNotifiedUserId') === userId; } catch (e) { return false; }
}

// ສະໝັກສະມາຊິກໃໝ່ດ້ວຍອີເມວ + ລະຫັດຜ່ານ
async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (!error) {
    sendDiscordNotification(null, {
      title: '🆕 ສະໝັກສະມາຊິກໃໝ່',
      color: 0xb8860b,
      fields: [
        { name: 'ອີເມວ', value: email, inline: false }
      ],
      timestamp: new Date().toISOString()
    });
    if (data?.user?.id) markDiscordNotified(data.user.id);
  }
  return { data, error };
}

// ເຂົ້າສູ່ລະບົບດ້ວຍອີເມວ + ລະຫັດຜ່ານ
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (!error) {
    sendDiscordNotification(null, {
      title: '🔐 ເຂົ້າສູ່ລະບົບ',
      color: 0xffcf4d,
      fields: [
        { name: 'ອີເມວ', value: email, inline: false }
      ],
      timestamp: new Date().toISOString()
    });
    if (data?.user?.id) markDiscordNotified(data.user.id);
  }
  return { data, error };
}

// ເຂົ້າສູ່ລະບົບດ້ວຍ Google (ຈະພາໄປໜ້າ Google ແລ້ວກັບມາທີ່ redirectTo)
async function signInWithGoogle(redirectPath) {
  const redirectTo = new URL(redirectPath || 'index.html', window.location.href).toString();
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  return { error };
}

// ອອກຈາກລະບົບ ແລ້ວພາກັບໜ້າທຳອິດ
async function signOut() {
  try { sessionStorage.removeItem('discordNotifiedUserId'); } catch (e) {}
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// ດຶງຂໍ້ມູນຜູ້ໃຊ້ປັດຈຸບັນ (ຄືນຄ່າ null ຖ້າຍັງບໍ່ໄດ້ເຂົ້າສູ່ລະບົບ)
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? session.user : null;
}

// ກວດວ່າຜູ້ໃຊ້ປັດຈຸບັນແມ່ນແອດມິນຫຼືບໍ່ (ປຽບທຽບອີເມວກັບ ADMIN_EMAIL ໃນ config.js)
async function isAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === String(ADMIN_EMAIL || '').toLowerCase();
}

// ============================================
// ຍອດເງິນຄົງເຫຼືອ (wallet) — ຕ້ອງແລ່ນ wallet_setup.sql ໃນ Supabase ກ່ອນ
// ============================================
async function getWalletBalance(userId) {
  try {
    const { data, error } = await supabaseClient
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.balance) : 0;
  } catch (err) {
    console.error('ດຶງຍອດເງິນບໍ່ສຳເລັດ', err);
    return 0;
  }
}

function formatKipWallet(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

// ============================================
// DROPDOWN MENU ຂອງໄອຄອນໂປຣໄຟລ໌ (avatar) — ຄລິກແລ້ວໂຊວ໌ຊື່/badge/ຍອດເງິນ + ລິ້ງລັດ
// ============================================
function acctFormatBaht(n) {
  return formatKipWallet(n);
}
function acctEscapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function injectAccountMenuStyles() {
  if (document.getElementById('acctMenuStyles')) return;
  const style = document.createElement('style');
  style.id = 'acctMenuStyles';
  style.textContent = `
    .acct-slot{ position:relative; display:inline-flex; }
    .acct-avatar-btn{
      width:36px;height:36px;border-radius:50%;flex-shrink:0;overflow:hidden;
      display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,var(--black-300),var(--black-500));
      border:1px solid rgba(255,207,77,0.4);color:#fff;cursor:pointer;padding:0;
      appearance:none;-webkit-appearance:none;font:inherit;
      transition:box-shadow .2s ease, transform .15s ease;
    }
    .acct-avatar-btn:hover{ box-shadow:0 0 14px -2px rgba(255,207,77,0.5); }
    .acct-avatar-btn:active{ transform:scale(0.94); }
    .acct-avatar-btn svg{ width:18px;height:18px;stroke:currentColor; }
    .acct-dropdown{
      position:absolute; top:calc(100% + 10px); right:0; width:254px; max-width:82vw;
      background:linear-gradient(165deg, rgba(19,22,32,0.98), rgba(5,7,12,0.99));
      border:1px solid rgba(232,173,46,0.25); border-radius:16px;
      box-shadow:0 14px 34px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,207,77,0.05);
      padding:16px 0 8px; z-index:60; font-family:'Chakra Petch','Noto Sans Lao',sans-serif;
      opacity:0; visibility:hidden; transform:translateY(-8px) scale(0.97); pointer-events:none;
      transition:opacity .18s ease, transform .18s ease, visibility .18s;
    }
    .acct-dropdown.show{ opacity:1; visibility:visible; transform:translateY(0) scale(1); pointer-events:auto; }
    .acct-dd-user{ padding:0 18px 14px; border-bottom:1px solid rgba(154,154,164,0.14); margin-bottom:6px; }
    .acct-dd-name{ font-size:15px; font-weight:800; color:var(--ink-100); margin-bottom:7px; word-break:break-all; }
    .acct-dd-badge{
      display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:999px;
      border:1px solid rgba(255,207,77,0.4); background:rgba(255,207,77,0.08);
      color:var(--shine-dim); font-weight:700; font-size:11px; letter-spacing:0.4px; margin-bottom:8px;
    }
    .acct-dd-badge.is-admin{ border-color:rgba(255,84,112,0.45); background:rgba(255,84,112,0.08); color:#ff8fa3; }
    .acct-dd-badge svg{ width:11px;height:11px; stroke:currentColor; }
    .acct-dd-balance{ font-size:12.5px; color:var(--ink-500); }
    .acct-dd-balance b{ color:var(--ink-100); font-variant-numeric:tabular-nums; }
    .acct-dd-nav{ display:flex; flex-direction:column; padding:4px 8px; }
    .acct-dd-link{
      display:flex; align-items:center; gap:11px; padding:10px 10px; border-radius:10px;
      color:var(--ink-100); font-size:13.5px; font-weight:600; text-decoration:none;
      background:none; border:none; cursor:pointer; text-align:left; width:100%; font-family:inherit;
    }
    .acct-dd-link:hover{ background:rgba(255,207,77,0.07); }
    .acct-dd-link svg{ width:17px;height:17px; stroke:var(--shine-dim); flex-shrink:0; }
    .acct-dd-link.danger{ color:#ff8fa3; }
    .acct-dd-link.danger svg{ stroke:#ff8fa3; }
    .acct-dd-divider{ height:1px; background:rgba(154,154,164,0.14); margin:4px 12px; }
    @media (max-width:380px){ .acct-dropdown{ width:224px; right:-8px; } }
  `;
  document.head.appendChild(style);
}

// ໃຫ້ authSlot ຄ່ອຍໆຈາງເຂົ້າມາເອງ ບໍ່ວ່າຈະໂຫຼດຂໍ້ມູນສຳເລັດຊ້າ/ໄວປານໃດ (ບໍ່ໃຫ້ "ຜຸດ" ຂຶ້ນມາທັນທີແບບບໍ່ມີ transition)
function revealAuthSlot(el){
  if (!el) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('slot-in');
    });
  });
}

// ສີດ CSS ຂອງ wallet chip ເຂົ້າໜ້າ (ເທື່ອດຽວ) ເພື່ອບໍ່ຕ້ອງແກ້ style.css ຂອງທຸກໜ້າ
function injectWalletStyles() {
  if (document.getElementById('walletChipStyles')) return;
  const style = document.createElement('style');
  style.id = 'walletChipStyles';
  style.textContent = `
    .wallet-chip{
      display:flex;align-items:center;gap:6px;
      padding:7px 13px;border-radius:20px;
      background:linear-gradient(135deg, rgba(232,173,46,0.12), rgba(32,181,106,0.08));
      border:1px solid rgba(232,173,46,0.28);
      font-family:'Chakra Petch','Noto Sans Lao',sans-serif;
      font-weight:700;font-size:12.5px;color:#b8860b;
      white-space:nowrap;transition:box-shadow .2s ease;
    }
    .wallet-chip:hover{ box-shadow:0 0 0 3px rgba(232,173,46,0.12); }
    .wallet-chip svg{ width:15px;height:15px;stroke:#b8860b;flex-shrink:0; }
    .wallet-chip .wallet-amt{ font-variant-numeric:tabular-nums; }
    @media (max-width:380px){ .wallet-chip{ padding:6px 10px;font-size:11.5px; } }
  `;
  document.head.appendChild(style);
}

// ອັບເດດປຸ່ມ/ຂໍ້ຄວາມໃນແຖບເມນູໃຫ້ກົງກັບສະຖານະເຂົ້າສູ່ລະບົບ
// ຕ້ອງມີ element id="authSlot" ຢູ່ໃນໜ້ານັ້ນໆ (ຍອດເງິນ + ປຸ່ມແອດມິນ ຈະຢູ່ບ່ອນນີ້)
// ຖ້າໜ້ານັ້ນມີ element id="userChipRow" ດ້ວຍ (ເຊັ່ນ index.html) -> ຊິບໂປຣໄຟລ໌ (avatar + ອອກຈາກລະບົບ)
// ຈະຖືກຍ້າຍໄປໂຊວ໌ຢູ່ບ່ອນນັ້ນແທນ ເພື່ອບໍ່ໃຫ້ navbar ແອອັດ. ຖ້າບໍ່ມີ userChipRow (ໜ້າອື່ນໆ)
// ຊິບໂປຣໄຟລ໌ຈະຄືນໄປໂຊວ໌ຢູ່ໃນ authSlot ຄືເກົ່າ.
async function renderAuthUI() {
  const user = await getCurrentUser();
  const authSlot = document.getElementById('authSlot');
  // ໝາຍເຫດ: index.html ບາງໜ້າຕັ້ງ id ຂອງກ່ອງນີ້ວ່າ "sideMenuUser" (ບໍ່ແມ່ນ "userChipRow")
  // ຈຶ່ງເພີ່ມ fallback ໄປຫາ .side-menu-user ເພື່ອໃຫ້ຫາເຫັນ ບໍ່ຕົກໄປແອອັດຢູ່ໃນ authSlot
  const userChipRow = document.getElementById('userChipRow') || document.querySelector('.side-menu-user');

  // ຄຸມ Google OAuth ຫຼືກໍລະນີອື່ນທີ່ session ຖືກສ້າງໂດຍບໍ່ໄດ້ຜ່ານ signIn()/signUp() ຂ້າງເທິງ
  if (user && !alreadyDiscordNotified(user.id)) {
    sendDiscordNotification(null, {
      title: '🔐 ເຂົ້າສູ່ລະບົບ',
      color: 0xffcf4d,
      fields: [
        { name: 'ອີເມວ', value: user.email || '(ບໍ່ມີອີເມວ)', inline: false }
      ],
      timestamp: new Date().toISOString()
    });
    markDiscordNotified(user.id);
  }

  if (!authSlot) return;

  if (user) {
    // ໝາຍເຫດ: ໄອຄອນຄົນ (ໂປຣໄຟລ໌) ຢູ່ navbar ຕອນນີ້ກົດແລ້ວຈະໂຊວ໌ dropdown ເມນູ
    // (ຊື່/badge ສະມາຊິກ/ຍອດເງິນ + ລິ້ງລັດ ຈັດການໂປຣໄຟລ໌ / ສະຖານະຄຳສັ່ງຊື້ / ເຕີມເງິນ / ປະຫວັດການເຕີມເງິນ / ຕິດຕໍ່ເຮົາ / ອອກຈາກລະບົບ)
    injectAccountMenuStyles();

    const meta = user.user_metadata || {};
    const displayName = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'ຜູ້ໃຊ້');
    const avatarUrl = meta.avatar_url || meta.picture || null;
    const avatarInnerHtml = avatarUrl
      ? `<img src="${acctEscapeHtml(avatarUrl)}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    let acctAdmin = false, acctBalance = 0;
    try {
      const [adminRes, balanceRes] = await Promise.all([isAdmin(), getWalletBalance(user.id)]);
      acctAdmin = adminRes; acctBalance = balanceRes;
    } catch (e) {}

    const acctBadgeHtml = acctAdmin
      ? `<span class="acct-dd-badge is-admin"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5Z"/></svg> ADMIN</span>`
      : `<span class="acct-dd-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> MEMBER</span>`;

    const acctAdminLinkHtml = acctAdmin
      ? `<a class="acct-dd-link" href="admin.html" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg>
              ຫ້ອງຄວບຄຸມແອດມິນ
            </a>`
      : '';

    authSlot.innerHTML = `
      <div class="acct-slot" id="acctSlot">
        <button class="acct-avatar-btn" id="acctAvatarBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="ບັນຊີຂອງຂ້ອຍ" title="ບັນຊີຂອງຂ້ອຍ">
          ${avatarInnerHtml}
        </button>
        <div class="acct-dropdown" id="acctDropdown" role="menu" aria-hidden="true">
          <div class="acct-dd-user">
            <div class="acct-dd-name">${acctEscapeHtml(displayName)}</div>
            ${acctBadgeHtml}
            <div class="acct-dd-balance">ຍອດເງິນ: <b>${acctFormatBaht(acctBalance)}</b></div>
          </div>
          <nav class="acct-dd-nav">
            ${acctAdminLinkHtml}
            <a class="acct-dd-link" href="profile.html" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="16" r="2.2"/><path d="M19 12.5v1M19 18.5v1M21.6 14.8l-.9.5M17.3 17.7l-.9.5M21.6 17.2l-.9-.5M17.3 14.3l-.9-.5"/></svg>
              ຈັດການໂປຣໄຟລ໌
            </a>
            <a class="acct-dd-link" href="orders.html" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.3 7 12 12 20.7 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
              ສະຖານະຄຳສັ່ງຊື້
            </a>
            <a class="acct-dd-link" href="topup.html" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 15h.01"/></svg>
              ເຕີມເງິນ
            </a>
            <a class="acct-dd-link" href="topup-history.html" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
              ປະຫວັດການເຕີມເງິນ
            </a>
            <a class="acct-dd-link" href="index.html#siteFooter" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              ຕິດຕໍ່ພວກເຮົາ
            </a>
          </nav>
          <div class="acct-dd-divider"></div>
          <nav class="acct-dd-nav">
            <button type="button" class="acct-dd-link danger" id="acctDdLogout" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              ອອກຈາກລະບົບ
            </button>
          </nav>
        </div>
      </div>`;

    const acctBtn = document.getElementById('acctAvatarBtn');
    const acctDropdown = document.getElementById('acctDropdown');
    const closeAcctDropdown = () => {
      if (!acctDropdown) return;
      acctDropdown.classList.remove('show');
      acctDropdown.setAttribute('aria-hidden', 'true');
      if (acctBtn) acctBtn.setAttribute('aria-expanded', 'false');
    };
    const openAcctDropdown = () => {
      acctDropdown.classList.add('show');
      acctDropdown.setAttribute('aria-hidden', 'false');
      acctBtn.setAttribute('aria-expanded', 'true');
    };
    if (acctBtn && acctDropdown) {
      acctBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        acctDropdown.classList.contains('show') ? closeAcctDropdown() : openAcctDropdown();
      });
      acctDropdown.addEventListener('click', (e) => e.stopPropagation());
      document.addEventListener('click', closeAcctDropdown);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAcctDropdown(); });
      const acctLogoutBtn = document.getElementById('acctDdLogout');
      if (acctLogoutBtn) acctLogoutBtn.addEventListener('click', () => signOut());
    }

    if (userChipRow) userChipRow.innerHTML = '';

    // ===== ເມນູຂ້າງ (side-menu): ໂຊວ໌ "ລະບົບສະມາຊິກ" ແທນປຸ່ມ ເຂົ້າສູ່ລະບົບ/ສະໝັກ =====
    const guestBox = document.getElementById('sideMenuGuestBox');
    const memberBox = document.getElementById('sideMenuMemberBox');
    const profileLink = document.getElementById('sideMenuProfileLink');
    const orderStatusLink = document.getElementById('sideMenuOrderStatusLink');
    const topupHistoryLink = document.getElementById('sideMenuTopupHistoryLink');
    const sideLogoutLink = document.getElementById('sideMenuLogoutLink');
    if (guestBox) guestBox.style.display = 'none';
    if (memberBox) memberBox.style.display = '';
    if (orderStatusLink) orderStatusLink.style.display = '';
    if (topupHistoryLink) topupHistoryLink.style.display = '';
    if (sideLogoutLink) {
      sideLogoutLink.style.display = '';
      if (!sideLogoutLink.dataset.bound) {
        sideLogoutLink.dataset.bound = '1';
        sideLogoutLink.addEventListener('click', (e) => { e.preventDefault(); signOut(); });
      }
    }
    if (profileLink) {
      profileLink.style.display = '';
    }

    revealAuthSlot(authSlot);

  } else {
    authSlot.innerHTML = `
      <a class="btn-login" href="login.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ເຂົ້າສູ່ລະບົບ
      </a>
    `;
    if (userChipRow) userChipRow.innerHTML = '';

    // ===== ເມນູຂ້າງ: ຍັງບໍ່ login -> ໂຊວ໌ປຸ່ມ ເຂົ້າສູ່ລະບົບ/ສະໝັກ, ເຊື່ອງລາຍການສະມາຊິກ =====
    const guestBox = document.getElementById('sideMenuGuestBox');
    const memberBox = document.getElementById('sideMenuMemberBox');
    const profileLink = document.getElementById('sideMenuProfileLink');
    const orderStatusLink = document.getElementById('sideMenuOrderStatusLink');
    const topupHistoryLink = document.getElementById('sideMenuTopupHistoryLink');
    const sideLogoutLink = document.getElementById('sideMenuLogoutLink');
    if (guestBox) guestBox.style.display = '';
    if (memberBox) memberBox.style.display = 'none';
    if (profileLink) profileLink.style.display = 'none';
    if (orderStatusLink) orderStatusLink.style.display = 'none';
    if (topupHistoryLink) topupHistoryLink.style.display = 'none';
    if (sideLogoutLink) sideLogoutLink.style.display = 'none';

    revealAuthSlot(authSlot);
  }
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
