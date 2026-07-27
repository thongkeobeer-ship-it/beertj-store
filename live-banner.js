// ============================================
// ແຖບແຈ້ງເຕືອນສົດ (live-banner) — ດຶງລາຍການລ່າສຸດ "ຢືນຢັນ/ສຳເລັດແລ້ວ" ມາສະແດງ
// ຮອງຮັບ 2 ແຫຼ່ງ: (1) ການເຕີມເງິນທີ່ຖືກອະນຸມັດ (topup_requests)
//                  (2) ການສັ່ງຊື້ສິນຄ້າທີ່ສຳເລັດແລ້ວ (orders)
// ຈະສະແດງອັນໃດກໍໄດ້ທີ່ "ໃໝ່ກວ່າ" ລະຫວ່າງສອງແຫຼ່ງນີ້
//
// ໝາຍເຫດ: ໂຄງສ້າງຕາຕະລາງ "orders" ຂອງແຕ່ລະຮ້ານອາດຕ່າງກັນ (ຊື່ຄໍລຳຍອດເງິນອາດເປັນ
// total_price / amount / price ແລ້ວແຕ່ການອອກແບບ) — ໂຄ້ດຂ້າງລຸ່ມນີ້ຈຶ່ງພະຍາຍາມອ່ານ
// ຫຼາຍຊື່ຄໍລຳ ແລະ ຖ້າຕາຕະລາງ/ຄໍລຳບໍ່ກົງກັບຂອງທ່ານ ມັນຈະ "ຂ້າມໄປງຽບໆ" ບໍ່ເຮັດໜ້າພັງ
// (ຖ້າສະແດງຜົນຍັງບໍ່ຖືກຕາມທີ່ຕ້ອງການ ກະລຸນາເບິ່ງຄໍລຳຈິງໃນຕາຕະລາງ orders ຂອງທ່ານ
// ແລ້ວແກ້ຊື່ຄໍລຳໃນຟັງຊັນ fetchLatestOrder() ໃຫ້ກົງກັນ)
// ============================================

const LIVE_BANNER_POLL_MS = 30000;
let liveBannerLastKey = null; // ໃຊ້ຈື່ວ່າແຈ້ງເຕືອນຄັ້ງລ່າສຸດແມ່ນອັນດຽວກັນບໍ່ ຈະໄດ້ບໍ່ replay animation ຊ້ຳໂດຍບໍ່ຈຳເປັນ

function relativeTimeLao(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return 'ຫາກໍ່ນີ້';
  if (mins < 60) return mins + ' ນາທີຜ່ານມາ';
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + ' ຊົ່ວໂມງຜ່ານມາ';
  const days = Math.round(hours / 24);
  return days + ' ວັນຜ່ານມາ';
}

// ໜ່ວຍເງິນຂອງຮ້ານແມ່ນ "ກີບ" (₭) — ບໍ່ແມ່ນ "ບາດ" ອີກຕໍ່ໄປ
function formatKipLive(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' ₭';
}

async function fetchLatestTopup() {
  if (typeof supabaseClient === 'undefined') return null;
  try {
    const { data, error } = await supabaseClient
      .from('topup_requests')
      .select('amount, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      type: 'topup',
      amount: data.amount,
      created_at: data.created_at,
      text: 'ມີການເຕີມເງິນສຳເລັດ — ' + formatKipLive(data.amount)
    };
  } catch (err) {
    return null;
  }
}

async function fetchLatestOrder() {
  if (typeof supabaseClient === 'undefined') return null;
  // ລອງຫຼາຍຄ່າ status ທີ່ນິຍົມໃຊ້ (completed / paid / success / delivered)
  // ຖ້າຕາຕະລາງ orders ຂອງທ່ານໃຊ້ຄ່າອື່ນ ໃຫ້ເພີ່ມເຂົ້າໃນ list ນີ້
  const possibleStatuses = ['completed', 'paid', 'success', 'delivered', 'done'];
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .in('status', possibleStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;

    // ຄໍລຳຍອດເງິນອາດຊື່ບໍ່ຄືກັນລະຫວ່າງແຕ່ລະໂຄງການ -> ລອງໄລ່ຫາຊື່ທີ່ນິຍົມໃຊ້
    const amount = data.total_price ?? data.amount ?? data.price ?? data.total ?? 0;

    return {
      type: 'order',
      amount,
      created_at: data.created_at,
      text: 'ມີການສັ່ງຊື້ສິນຄ້າສຳເລັດ — ' + formatKipLive(amount)
    };
  } catch (err) {
    // ຕາຕະລາງ/ຄໍລຳບໍ່ກົງ -> ຂ້າມໄປງຽບໆ ບໍ່ໃຫ້ໜ້າພັງ
    return null;
  }
}

function playLiveBannerEnter(banner) {
  // ຣີເຊັດ class ກ່ອນ ເພື່ອບັງຄັບໃຫ້ animation ຫຼິ້ນຄືນໃໝ່ໄດ້ທຸກຄັ້ງ (ບໍ່ຕິດຄ້າງ/ກະຕຸກ)
  banner.classList.remove('live-banner-enter');
  void banner.offsetWidth; // ບັງຄັບ reflow
  banner.classList.add('live-banner-enter');
}

async function loadLiveBanner() {
  if (typeof supabaseClient === 'undefined') return;
  const banner = document.getElementById('liveBanner');
  const amountEl = document.getElementById('liveAmountText');
  const timeEl = document.getElementById('liveTimeText');
  if (!banner || !amountEl || !timeEl) return;

  const [topup, order] = await Promise.all([fetchLatestTopup(), fetchLatestOrder()]);

  // ເລືອກອັນທີ່ "ໃໝ່ກວ່າ" ລະຫວ່າງສອງແຫຼ່ງ
  let latest = null;
  if (topup && order) {
    latest = new Date(topup.created_at) >= new Date(order.created_at) ? topup : order;
  } else {
    latest = topup || order;
  }

  if (!latest) {
    banner.style.display = 'none';
    return;
  }

  const key = latest.type + '|' + latest.created_at;
  amountEl.textContent = latest.text;
  timeEl.textContent = relativeTimeLao(latest.created_at);
  banner.style.display = '';

  // ຫຼິ້ນອະນິເມຊັນເລື່ອນຂຶ້ນແບບສະມູດສະເພາະຕອນມີແຈ້ງເຕືອນໃໝ່ (ບໍ່ replay ຊ້ຳໆທຸກຄັ້ງທີ່ poll)
  if (key !== liveBannerLastKey) {
    liveBannerLastKey = key;
    playLiveBannerEnter(banner);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLiveBanner();
  setInterval(loadLiveBanner, LIVE_BANNER_POLL_MS);
});
