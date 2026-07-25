// ============================================
// ແຖບແຈ້ງເຕືອນສົດ (live-banner) — ດຶງຍອດເຕີມເງິນລ່າສຸດທີ່ "ຢືນຢັນແລ້ວ"
// ມາສະແດງແທນຂໍ້ຄວາມຕົວຢ່າງ 0 ບາດ
// ============================================

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

function formatBahtLive(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' ບາດ';
}

async function loadLiveBanner() {
  if (typeof supabaseClient === 'undefined') return;
  const banner = document.getElementById('liveBanner');
  const amountEl = document.getElementById('liveAmountText');
  const timeEl = document.getElementById('liveTimeText');
  if (!banner || !amountEl || !timeEl) return;

  try {
    const { data, error } = await supabaseClient
      .from('topup_requests')
      .select('amount, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      banner.style.display = 'none';
      return;
    }

    amountEl.textContent = 'ຕົວຢ່າງຂໍ້ຄວາມແຈ້ງເຕືອນການເຕີມເງິນ — ' + formatBahtLive(data.amount);
    timeEl.textContent = relativeTimeLao(data.created_at);
    banner.style.display = '';
  } catch (err) {
    console.error(err);
    banner.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadLiveBanner();
  setInterval(loadLiveBanner, 30000); // ອັບເດດທຸກ 30 ວິນາທີ
});
