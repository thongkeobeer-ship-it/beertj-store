// ============================================
// ระบบสมาชิก (Supabase Auth) — ใช้ร่วมกันทุกหน้า
// ต้อง include ตามลำดับ: supabase-js CDN -> config.js -> auth.js
// ============================================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// สมัครสมาชิกใหม่ด้วยอีเมล + รหัสผ่าน
async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  return { data, error };
}

// เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  return { data, error };
}

// เข้าสู่ระบบด้วย Google (จะเด้งไปหน้า Google แล้วเด้งกลับมาที่ redirectTo)
async function signInWithGoogle(redirectPath) {
  const redirectTo = new URL(redirectPath || 'index.html', window.location.href).toString();
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  return { error };
}

// ออกจากระบบ แล้วพากลับหน้าแรก
async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// ดึงข้อมูลผู้ใช้ปัจจุบัน (คืนค่า null ถ้ายังไม่ได้ล็อกอิน)
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session ? session.user : null;
}

// อัปเดตปุ่ม/ข้อความในแถบเมนูให้ตรงกับสถานะล็อกอิน
// ต้องมี element id="authSlot" อยู่ในหน้านั้นๆ
async function renderAuthUI() {
  const user = await getCurrentUser();
  const authSlot = document.getElementById('authSlot');
  if (!authSlot) return;

  if (user) {
    const initial = user.email ? user.email.charAt(0) : '?';
    authSlot.innerHTML = `
      <div class="user-chip" id="userChip">
        <div class="user-avatar">${initial}</div>
        <span class="user-email">${user.email}</span>
        <svg class="chip-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="logout-menu" id="logoutMenu">
        <div class="menu-email">${user.email}</div>
        <button class="btn-logout" id="logoutBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ออกจากระบบ
        </button>
      </div>
    `;

    const userChip = document.getElementById('userChip');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutBtn = document.getElementById('logoutBtn');

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

  } else {
    authSlot.innerHTML = `
      <a class="btn-login" href="login.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        เข้าสู่ระบบ
      </a>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
