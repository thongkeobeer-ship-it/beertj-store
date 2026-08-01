// ສະຄຣິບໜ້າເຕີມເງິນ — ເລືອກຍອດ / ສະແກນ QR / ອັບໂຫຼດສະລິບ / ລໍຖ້າແອດມິນກວດສອບ

const TOPUP_PRESETS = [20000, 50000, 100000, 200000, 500000, 1000000];
const TOPUP_BUCKET = 'topup-slips';   // ຊື່ bucket ໃນ Supabase Storage (ຕ້ອງສ້າງໄວ້ລ່ວງໜ້າ)
const TOPUP_TABLE = 'topup_requests'; // ຊື່ຕາຕະລາງໃນ Supabase (ຕ້ອງສ້າງໄວ້ລ່ວງໜ້າ)

let selectedAmount = 0;
let selectedSlipFile = null;
let selectedBank = 1;      // 1 = ທະນາຄານ 1 (qr_url/qr_label), 2 = ທະນາຄານ 2 (qr_url_2/qr_label_2)
let topupSettings = null;  // ຄ່າຕັ້ງຄ່າຮ້ານ (ຊື່ທະນາຄານ, ຮູບ QR) ດຶງມາຈາກ Supabase

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

function formatKip(n){
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

function showStep(stepId){
  document.querySelectorAll('.topup-step').forEach(el => el.classList.remove('is-active'));
  document.getElementById(stepId).classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuickAmountRow(){
  const row = document.getElementById('quickAmountRow');
  row.innerHTML = TOPUP_PRESETS.map(amt => `
    <div class="quick-amount-pill" data-amount="${amt}">${amt.toLocaleString('th-TH')} ₭</div>
  `).join('');

  row.querySelectorAll('.quick-amount-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const amount = Number(pill.dataset.amount);
      document.getElementById('customAmountInput').value = amount;
      selectAmount(amount, pill);
    });
  });
}

function selectAmount(amount, pillEl){
  selectedAmount = amount;
  document.querySelectorAll('.quick-amount-pill').forEach(p => p.classList.remove('is-selected'));
  if (pillEl) pillEl.classList.add('is-selected');
  updateGoToPayState();
}

// --- ໂຫຼດຊື່ທະນາຄານ + ຮູບ QR ຈາກການຕັ້ງຄ່າຮ້ານ (site_settings) ແລ້ວມາໃສ່ 2 ບັດເລືອກທະນາຄານ ---
async function loadBankOptions(){
  topupSettings = typeof fetchSiteSettings === 'function' ? await fetchSiteSettings() : {};

  const name1El = document.getElementById('methodBank1Name');
  const name2El = document.getElementById('methodBank2Name');
  const card2 = document.getElementById('methodBank2');
  const sub2 = document.getElementById('methodBank2Sub');

  name1El.textContent = topupSettings.qr_label || 'ທະນາຄານ 1';

  if (topupSettings.qr_url_2) {
    name2El.textContent = topupSettings.qr_label_2 || 'ທະນາຄານ 2';
    card2.classList.remove('is-disabled');
    sub2.textContent = 'ໂອນຜ່ານທະນາຄານນີ້';
    sub2.classList.remove('is-soon');
    sub2.classList.add('is-auto');
  } else {
    name2El.textContent = topupSettings.qr_label_2 || 'ທະນາຄານ 2';
    card2.classList.add('is-disabled');
    sub2.textContent = 'ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ';
    sub2.classList.add('is-soon');
    sub2.classList.remove('is-auto');
  }

  selectBank(1);
}

function selectBank(bankNum){
  if (bankNum === 2 && !(topupSettings && topupSettings.qr_url_2)) return; // ບໍ່ໄດ້ຕັ້ງຄ່າ QR ອັນທີ 2 ໄວ້ -> ເລືອກບໍ່ໄດ້
  selectedBank = bankNum;

  document.getElementById('methodBank1').classList.toggle('is-selected', bankNum === 1);
  document.getElementById('methodBank2').classList.toggle('is-selected', bankNum === 2);

  const bankName = bankNum === 2
    ? (topupSettings?.qr_label_2 || 'ທະນາຄານ 2')
    : (topupSettings?.qr_label || 'ທະນາຄານ 1');

  document.getElementById('topupInfoTitle').textContent = `ໂອນ QR ${bankName}`;
  document.getElementById('topupInfoDesc').textContent =
    `ສະແກນ QR ຮັບເງິນຂອງຮ້ານ (${bankName}) ຜ່ານແອັບທະນາຄານ ແລ້ວອັບໂຫຼດສະລິບເພື່ອລໍຖ້າແອດມິນກວດສອບ`;
}

function updateGoToPayState(){
  const btn = document.getElementById('goToPayBtn');
  const valid = selectedAmount >= 1000;
  btn.disabled = !valid;
  btn.style.opacity = valid ? '1' : '0.5';
}

function updateConfirmState(){
  const btn = document.getElementById('confirmTopupBtn');
  const valid = !!selectedSlipFile;
  btn.disabled = !valid;
  btn.style.opacity = valid ? '1' : '0.5';
}

document.addEventListener('DOMContentLoaded', () => {
  renderQuickAmountRow();
  loadBankOptions();

  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.length > 1 ? window.history.back() : (window.location.href = 'index.html');
  });

  // --- ເລືອກທະນາຄານທີ່ຈະໂອນ ---
  document.getElementById('methodBank1').addEventListener('click', () => selectBank(1));
  document.getElementById('methodBank2').addEventListener('click', () => {
    if (!(topupSettings && topupSettings.qr_url_2)) {
      showToast('ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ QR ຂອງທະນາຄານນີ້');
      return;
    }
    selectBank(2);
  });

  // --- ຈຳນວນເງິນ: ພິມເອງ ຫຼື ກົດປຸ່ມລັດ ---
  const customInput = document.getElementById('customAmountInput');

  customInput.addEventListener('input', () => {
    selectedAmount = Math.max(0, Number(customInput.value) || 0);
    document.querySelectorAll('.quick-amount-pill').forEach(p => {
      p.classList.toggle('is-selected', Number(p.dataset.amount) === selectedAmount);
    });
    updateGoToPayState();
  });

  // --- ໄປຂັ້ນຕອນຈ່າຍເງິນ (ໂຊວ໌ QR ສະເພາະທະນາຄານທີ່ເລືອກໄວ້) ---
  document.getElementById('goToPayBtn').addEventListener('click', () => {
    if (selectedAmount < 1000) return;
    document.getElementById('qrAmountText').textContent = formatKip(selectedAmount);

    const col1 = document.getElementById('qrCol1');
    const col2 = document.getElementById('qrCol2');
    if (selectedBank === 2) {
      col1.style.display = 'none';
      col2.style.display = '';
    } else {
      col1.style.display = '';
      col2.style.display = 'none';
    }

    showStep('stepPay');
  });

  document.getElementById('backToAmount').addEventListener('click', () => {
    showStep('stepAmount');
  });

  // --- ອັບໂຫຼດສະລິບ + ພຣີວິວ ---
  const slipInput = document.getElementById('slipInput');
  const slipUpload = document.getElementById('slipUpload');
  const slipPreview = document.getElementById('slipPreview');
  const slipFilename = document.getElementById('slipFilename');

  slipInput.addEventListener('change', () => {
    const file = slipInput.files[0];
    if (!file) return;
    selectedSlipFile = file;
    slipPreview.src = URL.createObjectURL(file);
    slipFilename.textContent = file.name;
    slipUpload.classList.add('has-file');
    updateConfirmState();
  });

  // --- ຢືນຢັນການໂອນເງິນ ---
  document.getElementById('confirmTopupBtn').addEventListener('click', async () => {
    if (!selectedSlipFile || selectedAmount < 1000) return;

    if (typeof supabaseClient === 'undefined') {
      showToast('ຍັງບໍ່ໄດ້ຕັ້ງຄ່າການເຊື່ອມຕໍ່ຖານຂໍ້ມູນ');
      return;
    }

    const user = typeof getCurrentUser === 'function' ? await getCurrentUser() : null;
    if (!user) {
      showToast('ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນເຕີມເງິນ');
      window.location.href = 'login.html?redirect=topup.html';
      return;
    }

    const btn = document.getElementById('confirmTopupBtn');
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.textContent = 'ກຳລັງອັບໂຫຼດ...';

    try {
      const ext = selectedSlipFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from(TOPUP_BUCKET)
        .upload(path, selectedSlipFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseClient
        .storage
        .from(TOPUP_BUCKET)
        .getPublicUrl(path);

      const { data: inserted, error: insertError } = await supabaseClient
        .from(TOPUP_TABLE)
        .insert({
          user_id: user.id,
          amount: selectedAmount,
          slip_url: publicUrlData.publicUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const ref = inserted?.id ? String(inserted.id).slice(0, 8).toUpperCase() : ('TP-' + Date.now().toString(36).toUpperCase());

      // ---- ແຈ້ງເຕືອນໄປ Discord: ມີການສົ່ງສະລິບເຕີມເງິນໃໝ່ ----
      if (typeof sendDiscordNotification === 'function') {
        sendDiscordNotification(null, {
          title: '💰 ມີການເຕີມເງິນໃໝ່ (ລໍຖ້າກວດສອບ)',
          color: 0xffc400,
          fields: [
            { name: 'ອີເມວ', value: user.email || '(ບໍ່ມີອີເມວ)', inline: true },
            { name: 'ຍອດເງິນ', value: formatKip(selectedAmount), inline: true },
            { name: 'ລະຫັດອ້າງອີງ', value: ref, inline: true }
          ],
          image: { url: publicUrlData.publicUrl },
          timestamp: new Date().toISOString()
        });
      }

      document.getElementById('waitRef').textContent = ref;
      document.getElementById('waitAmount').textContent = formatKip(selectedAmount);
      document.getElementById('waitTime').textContent = new Date().toLocaleString('th-TH');

      showStep('stepWaiting');
    } catch (err) {
      console.error(err);
      showToast('ເກີດຂໍ້ຜິດພາດ ລອງໃໝ່ພາຍຫຼັງ');
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = 'ຢືນຢັນການໂອນເງິນ <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    }
  });

  document.getElementById('backHomeBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});
