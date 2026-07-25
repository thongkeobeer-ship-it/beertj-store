// ============================================
// ລະບົບສະມາຊິກ (Supabase Auth) — ໃຊ້ຮ່ວມກັນທຸກໜ້າ
// ຕ້ອງ include ຕາມລຳດັບ: supabase-js CDN -> config.js -> auth.js
// ============================================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ສະໝັກສະມາຊິກໃໝ່ດ້ວຍອີເມວ + ລະຫັດຜ່ານ
async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error };
}

// ເຂົ້າສູ່ລະບົບດ້ວຍອີເມວ + ລະຫັດຜ່ານ
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
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

// ອັບເດດປຸ່ມ/ຂໍ້ຄວາມໃນແຖບເມນູໃຫ້ກົງກັບສະຖານະເຂົ້າສູ່ລະບົບ
// ຕ້ອງມີ element id="authSlot" ຢູ່ໃນໜ້ານັ້ນໆ
async function renderAuthUI() {
  const user = await getCurrentUser();
  const authSlot = document.getElementById('authSlot');
  if (!authSlot) return;

  if (user) {
    const initial = user.email ? user.email.charAt(0).toUpperCase() : '?';
    const admin = await isAdmin();
    const adminBtnHtml = admin ? `
        <button class="btn-admin" id="adminEntryBtn" title="ໜ້າຄວບຄຸມແອດມິນ" aria-label="ໜ້າຄວບຄຸມແອດມິນ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg>
        </button>` : '';

    authSlot.innerHTML = `
      ${adminBtnHtml}
      <div class="user-chip" id="userChip">
        <div class="user-avatar">${initial}</div>
        <span class="user-email">${user.email}</span>
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

  } else {
    authSlot.innerHTML = `
      <a class="btn-login" href="login.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        ເຂົ້າສູ່ລະບົບ
      </a>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
