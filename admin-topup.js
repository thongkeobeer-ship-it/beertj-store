// ສະຄຣິບໜ້າແອດມິນ — ຄຳຂໍເຕີມເງິນ

const TOPUP_TABLE = 'topup_requests';
const ADMIN_EMAIL = 'sivilayspeaking@gmail.com';

function formatKip(n){
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

function showToast(message){
  let toast = document.querySelector('.toast');
  if(!toast){
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function statusLabel(status){
  if (status === 'approved') return 'ອະນຸມັດແລ້ວ';
  if (status === 'rejected') return 'ປະຕິເສດ';
  return 'ລໍຖ້າກວດສອບ';
}

function requestCardHtml(r){
  const time = r.created_at ? new Date(r.created_at).toLocaleString('th-TH') : '';
  const isPending = r.status === 'pending' || !r.status;
  return `
  <div class="admin-topup-card" data-id="${r.id}" data-user="${r.user_id || ''}" data-amount="${r.amount || 0}">
    <div class="admin-topup-slip" data-img="${r.slip_url || ''}">
      ${r.slip_url ? `<img src="${r.slip_url}" alt="ສະລິບ">` : ''}
    </div>
    <div class="admin-topup-body">
      <div class="admin-topup-amount shine-text">${formatKip(r.amount)}</div>
      <div class="admin-topup-meta">
        ຜູ້ໃຊ້: ${r.user_id ? String(r.user_id).slice(0, 8) : '—'}<br>
        ເວລາ: ${time}
      </div>
      <div class="admin-topup-status ${r.status || 'pending'}">${statusLabel(r.status)}</div>
      ${isPending ? `
      <div class="admin-topup-actions">
        <button class="admin-btn admin-btn-approve" data-action="approve">ອະນຸມັດ</button>
        <button class="admin-btn admin-btn-reject" data-action="reject">ປະຕິເສດ</button>
      </div>` : ''}
    </div>
  </div>`;
}

async function loadTopupRequests(){
  const list = document.getElementById('topupList');
  if (typeof supabaseClient === 'undefined') {
    list.innerHTML = '<div class="empty-note">ຍັງບໍ່ໄດ້ຕັ້ງຄ່າການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ</div>';
    return;
  }

  const { data, error } = await supabaseClient
    .from(TOPUP_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = '<div class="empty-note">ບໍ່ສາມາດໂຫຼດຂໍ້ມູນໄດ້</div>';
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = '<div class="empty-note">ຍັງບໍ່ມີຄຳຂໍເຕີມເງິນ</div>';
    updateStats([]);
    return;
  }

  list.innerHTML = data.map(requestCardHtml).join('');
  updateStats(data);
  attachCardActions();
}

function updateStats(rows){
  const pending = rows.filter(r => !r.status || r.status === 'pending').length;
  const approved = rows.filter(r => r.status === 'approved').length;
  const rejected = rows.filter(r => r.status === 'rejected').length;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statApproved').textContent = approved;
  document.getElementById('statRejected').textContent = rejected;
}

function attachCardActions(){
  document.querySelectorAll('.admin-topup-slip[data-img]').forEach(el => {
    const img = el.dataset.img;
    if (!img) return;
    el.addEventListener('click', () => {
      document.getElementById('slipModalImg').src = img;
      document.getElementById('slipModal').classList.add('show');
    });
  });

  document.querySelectorAll('.admin-topup-card').forEach(card => {
    const id = card.dataset.id;
    const userId = card.dataset.user;
    const amount = Number(card.dataset.amount);
    card.querySelectorAll('.admin-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const newStatus = action === 'approve' ? 'approved' : 'rejected';

        card.querySelectorAll('.admin-btn').forEach(b => b.disabled = true);

        const { error } = await supabaseClient
          .from(TOPUP_TABLE)
          .update({ status: newStatus })
          .eq('id', id);

        if (error) {
          console.error(error);
          showToast('ບໍ່ສາມາດອັບເດດສະຖານະໄດ້');
          card.querySelectorAll('.admin-btn').forEach(b => b.disabled = false);
          return;
        }

        // ຖ້າອະນຸມັດ ໃຫ້ບວກຍອດເງິນເຂົ້າ wallet ຂອງຜູ້ໃຊ້ທັນທີ
        if (newStatus === 'approved') {
          const { error: creditError } = await supabaseClient.rpc('credit_wallet', {
            p_user_id: userId,
            p_amount: amount
          });
          if (creditError) {
            console.error(creditError);
            showToast('ອະນຸມັດແລ້ວ ແຕ່ບວກຍອດເງິນບໍ່ສຳເລັດ ກະລຸນາກວດສອບ');
          }
        }

        showToast(newStatus === 'approved' ? 'ອະນຸມັດແລ້ວ' : 'ປະຕິເສດແລ້ວ');
        loadTopupRequests();
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  document.getElementById('slipModal').addEventListener('click', () => {
    document.getElementById('slipModal').classList.remove('show');
  });

  // ກວດສອບວ່າເປັນແອດມິນ (ອີເມລ sivilayspeaking@gmail.com) ກ່ອນສະແດງໜ້ານີ້
  const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
  if (!user || user.email !== ADMIN_EMAIL) {
    document.getElementById('topupList').innerHTML =
      '<div class="empty-note">ໜ້ານີ້ສະເພາະແອດມິນເທົ່ານັ້ນ</div>';
    document.querySelectorAll('.stat-grid, .section-head').forEach(el => el.style.display = 'none');
    return;
  }

  loadTopupRequests();

  if (typeof supabaseClient !== 'undefined') {
    supabaseClient
      .channel('public:topup_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: TOPUP_TABLE }, () => {
        loadTopupRequests();
      })
      .subscribe();
  }
});
