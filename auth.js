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
    authSlot.innerHTML = `
      <span class="auth-email">${user.email}</span>
      <button class="btn btn-secondary btn-sm" id="logoutBtn">ออกจากระบบ</button>
    `;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', signOut);
  } else {
    authSlot.innerHTML = `<a class="btn btn-secondary btn-sm" href="login.html">เข้าสู่ระบบ</a>`;
  }
}

document.addEventListener('DOMContentLoaded', renderAuthUI);
