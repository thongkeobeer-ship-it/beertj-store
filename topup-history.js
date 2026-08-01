// ໜ້າ "ประวัติการเติมเงิน" — โชว์เฉพาะรายการเติมเงินของผู้ใช้ที่ล็อกอินอยู่ (ตาราง topup_requests เดียวกับ topup.js)

const TOPUP_TABLE = 'topup_requests';

function thFormatKip(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

function thFormatDate(iso) {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return iso; }
}

function thStatusLabel(status) {
  if (status === 'approved') return 'อนุมัติแล้ว';
  if (status === 'rejected') return 'ปฏิเสธ';
  return 'รอตรวจสอบ';
}

function thStatusKey(status) {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function renderTopupHistory(rows) {
  const list = document.getElementById('topupHistoryList');

  if (!rows || !rows.length) {
    list.innerHTML = '<div class="empty-note">ยังไม่มีประวัติการเติมเงิน</div>';
    return;
  }

  list.innerHTML = rows.map((r) => {
    const statusKey = thStatusKey(r.status);
    return `
      <div class="th-card" data-id="${r.id}">
        <div class="th-card-top">
          <div>
            <div class="th-card-amount">${thFormatKip(r.amount)}</div>
            <div class="th-card-meta">${thFormatDate(r.created_at)}</div>
          </div>
          <span class="th-status" data-status="${statusKey}">${thStatusLabel(r.status)}</span>
        </div>
        <div class="th-card-ref">รหัสอ้างอิง: ${String(r.id).slice(0, 8)}</div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
    });
  }

  const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
  if (!user) {
    window.location.href = 'login.html?redirect=topup-history.html';
    return;
  }

  const list = document.getElementById('topupHistoryList');
  try {
    const { data, error } = await supabaseClient
      .from(TOPUP_TABLE)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    renderTopupHistory(data || []);
  } catch (err) {
    console.error('ดึงประวัติการเติมเงินไม่สำเร็จ', err);
    list.innerHTML = '<div class="empty-note">โหลดประวัติการเติมเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</div>';
  }
});
