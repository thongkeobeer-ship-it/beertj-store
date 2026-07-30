// ============================================
// ລະບົບສະມາຊິກ (Supabase Auth) — ໃຊ້ຮ່ວມກັນທຸກໜ້າ
// ຕ້ອງ include ຕາມລຳດັບ: supabase-js CDN -> config.js -> auth.js
// ============================================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// ການແຈ້ງເຕືອນໄປຫາ Discord (webhook)
// ============================================
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1530920792513319126/9CgO0Xgjc8PMYL7TrXPRJYTIDxWpqD8Yfofd7zLQUPuMcinXRLJEcFUQnDot4_F8Brjc';

async function sendDiscordNotification(content, embed) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    const body = { content };
    if (embed) body.embeds = [embed];
    await fetch(DISCORD_WEBHOOK_URL, {
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
      font-family:'Chakra Petch','Noto Sans Thai',sans-serif;
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
    injectWalletStyles();
    const initial = user.email ? user.email.charAt(0).toUpperCase() : '?';
    const admin = await isAdmin();
    const balance = await getWalletBalance(user.id);

    const walletChipHtml = `
      <div class="wallet-chip" id="walletChip" title="ຍອດເງິນຄົງເຫຼືອ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 15h.01"/></svg>
        <span class="wallet-amt" id="walletBalanceText">${formatKipWallet(balance)}</span>
      </div>`;

    const adminBtnHtml = admin ? `
        <button class="btn-admin" id="adminEntryBtn" title="ໜ້າຄວບຄຸມແອດມິນ" aria-label="ໜ້າຄວບຄຸມແອດມິນ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg>
        </button>` : '';

    const userChipHtml = `
      <div class="user-chip" id="userChip">
        <div class="user-avatar">${initial}</div>
        <svg class="chip-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="logout-menu" id="logoutMenu">
        <div class="menu-email">${user.email}</div>
        <button class="btn-logout" id="logoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ອອກຈາກລະບົບ
        </button>
      </div>
    `;

    // ຍອດເງິນ + ປຸ່ມແອດມິນ -> ຢູ່ໃນ navbar ສະເໝີ
    authSlot.innerHTML = `${walletChipHtml}${adminBtnHtml}`;

    // ຊິບໂປຣໄຟລ໌ (avatar) -> ຖ້າມີ userChipRow ໃຫ້ໄປໂຊວ໌ບ່ອນນັ້ນ, ຖ້າບໍ່ມີໃຫ້ຄືນໄປໃສ່ໃນ authSlot ຄືເກົ່າ
    if (userChipRow) {
      userChipRow.innerHTML = userChipHtml;
    } else {
      authSlot.insertAdjacentHTML('beforeend', userChipHtml);
    }

    const userChip = document.getElementById('userChip');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminBtn = document.getElementById('adminEntryBtn');

    userChip.addEventListener('click', (e) => {
      e.stopPropagation();
      userChip.classList.toggle('open');
      logoutMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      userChip.classList.remove('open');
      logoutMenu.classList.remove('open');
    });
    if (logoutBtn) logoutBtn.addEventListener('click', signOut);
    if (adminBtn) adminBtn.addEventListener('click', () => { window.location.href = 'admin.html'; });

    revealAuthSlot(authSlot);

  } else {
    authSlot.innerHTML = `
      <a class="btn-login" href="login.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        ເຂົ້າສູ່ລະບົບ
      </a>
    `;
    if (userChipRow) userChipRow.innerHTML = '';
    revealAuthSlot(authSlot);
  }
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
