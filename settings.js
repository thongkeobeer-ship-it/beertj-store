// ============================================
// ການຕັ້ງຄ່າຮ້ານ (Site Settings) — ດຶງຈາກ Supabase ແລ້ວອັບເດດອົງປະກອບຕ່າງໆທົ່ວໜ້າເວັບ
// ຕ້ອງ include ຫຼັງ auth.js (ໃຊ້ supabaseClient) ແລະ ກ່ອນ menu.js / script.js / topup.js
// ຕ້ອງແລ່ນ site_settings_setup.sql ໃນ Supabase ກ່ອນ (ສ້າງຕາຕະລາງ site_settings)
// ============================================

const SITE_SETTINGS_TABLE = 'site_settings';
const SITE_SETTINGS_ID = 1;

// ຄ່າຕັ້ງຕົ້ນ — ໃຊ້ຊົ່ວຄາວຕອນຍັງໂຫຼດຈາກຖານຂໍ້ມູນບໍ່ທັນສຳເລັດ ຫຼື ຖ້າຫາກຕາຕະລາງຍັງບໍ່ຖືກສ້າງ
const DEFAULT_SITE_SETTINGS = {
  store_name: null,
  tagline: null,
  announcement_text: null,
  logo_url: null,
  qr_url: null,
  category_1_name: 'ໝວດໝູ່ 1',
  category_2_name: 'ໝວດໝູ່ 2',
  category_3_name: 'ໝວດໝູ່ 3'
};

async function fetchSiteSettings() {
  if (typeof supabaseClient === 'undefined') return { ...DEFAULT_SITE_SETTINGS };
  try {
    const { data, error } = await supabaseClient
      .from(SITE_SETTINGS_TABLE)
      .select('*')
      .eq('id', SITE_SETTINGS_ID)
      .maybeSingle();
    if (error || !data) return { ...DEFAULT_SITE_SETTINGS };
    return { ...DEFAULT_SITE_SETTINGS, ...data };
  } catch (err) {
    console.error('ໂຫຼດການຕັ້ງຄ່າຮ້ານບໍ່ສຳເລັດ', err);
    return { ...DEFAULT_SITE_SETTINGS };
  }
}

// ---------- ໂລໂກ້ຮ້ານ (ທຸກຈຸດທີ່ມີ [data-site-logo]) ----------
function applyLogo(url) {
  if (!url) return;
  document.querySelectorAll('[data-site-logo]').forEach((img) => { img.src = url; });
}

// ---------- ຊື່ຮ້ານ (ທຸກຈຸດທີ່ມີ [data-site-name] + ຫົວຂໍ້ browser tab + ໂລໂກ້ປະກາຍແສງ) ----------
function applyStoreName(name) {
  if (!name) return;
  document.querySelectorAll('[data-site-name]').forEach((el) => { el.textContent = name; });

  const titleTag = document.querySelector('title[data-site-title]');
  if (titleTag) document.title = name;

  // ໂລໂກ້ປະກາຍແສງເທິງວິດີໂອໜ້າຫຼັກ — ສ້າງໂຕອັກສອນ ແລະ ອະນິເມຊັນຄືນໃໝ່ໃຫ້ກົງກັບຊື່ຮ້ານ
  const heroSign = document.getElementById('heroSign');
  if (heroSign) {
    const letters = name.split('');
    let html = letters
      .map((ch, i) => {
        const safe = ch === ' ' ? '&nbsp;' : ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<span class="hero-letter" style="animation-delay:${(i % 11) * 0.09}s">${safe}</span>`;
      })
      .join('');
    for (let i = 1; i <= 5; i++) {
      html += `<span class="hero-spark spk${i}"></span>`;
    }
    heroSign.innerHTML = html;
  }
}

// ---------- ຄຳອະທິບາຍ (hero tagline) ----------
function applyTagline(text) {
  if (!text) return;
  const el = document.querySelector('[data-site-tagline]');
  if (el) el.textContent = text;
}

// ---------- QR ໂອນເງິນ (ໜ້າເຕີມເງິນ) ----------
function applyQr(url) {
  if (!url) return;
  const img = document.getElementById('qrImage');
  if (img) {
    img.src = url;
    img.style.display = '';
    const fallback = document.getElementById('qrFallback');
    if (fallback) fallback.style.display = 'none';
  }
}

// ---------- ຂໍ້ຄວາມປະກາດ (ເລື່ອນຂວາໄປຊ້າຍ ວົນຊ້ຳໄປເລື່ອຍໆ) ----------
function restartAnnounceMarquee() {
  const track = document.getElementById('announceTrack');
  if (!track) return;
  // ຣີເຊັດອະນິເມຊັນ ເພື່ອຄິດໄລ່ໄລຍະທາງໃໝ່ໃຫ້ຖືກຕ້ອງກັບຄວາມຍາວຂໍ້ຄວາມທີ່ປ່ຽນໄປ
  track.style.animation = 'none';
  void track.offsetWidth; // ບັງຄັບ reflow
  const singleWidth = track.scrollWidth / 2;
  const pxPerSecond = 55; // ຄວາມໄວການເລື່ອນ
  const duration = Math.max(6, singleWidth / pxPerSecond);
  track.style.animation = `marqueeScroll ${duration}s linear infinite`;
}

function applyAnnouncement(text) {
  if (!text) { restartAnnounceMarquee(); return; }
  const items = document.querySelectorAll('.announce-item');
  if (!items.length) return;
  items.forEach((el) => { el.textContent = text; });
  restartAnnounceMarquee();
}

// ---------- ໝວດໝູ່ (ປ່ຽນຊື່ໝວດ ແລະ ອັບເດດ card ໃນໜ້າຫຼັກ) ----------
function applyCategoryNames(settings) {
  const map = [
    { key: 'category_1_name', defaultVal: 'ໝວດໝູ່ 1' },
    { key: 'category_2_name', defaultVal: 'ໝວດໝູ່ 2' },
    { key: 'category_3_name', defaultVal: 'ໝວດໝູ່ 3' }
  ];
  map.forEach(({ key, defaultVal }) => {
    const newName = settings[key] || defaultVal;
    // ຄັ້ງທຳອິດ card ຍັງໃຊ້ຊື່ default ຢູ່ — ຄັ້ງຕໍ່ໆໄປ card ຈະຖືກປ່ຽນ data-category ໄປແລ້ວ
    // ຈຶ່ງເກັບຊື່ default ອັນທຳອິດໄວ້ໃນ data-default-category ເພື່ອຫາ card ນີ້ໄດ້ສະເໝີ
    let card = document.querySelector(`.cat-card[data-default-category="${defaultVal}"]`);
    if (!card) card = document.querySelector(`.cat-card[data-category="${defaultVal}"]`);
    if (!card) return;
    if (!card.dataset.defaultCategory) card.dataset.defaultCategory = defaultVal;
    card.dataset.category = newName;
    const h3 = card.querySelector('h3');
    if (h3) h3.textContent = newName;
  });
}

async function applySiteSettings() {
  const settings = await fetchSiteSettings();
  window.currentSiteSettings = settings;

  applyLogo(settings.logo_url);
  applyStoreName(settings.store_name);
  applyTagline(settings.tagline);
  applyAnnouncement(settings.announcement_text);
  applyQr(settings.qr_url);
  applyCategoryNames(settings);

  return settings;
}

document.addEventListener('DOMContentLoaded', () => {
  applySiteSettings();

  // ອັບເດດສົດ: ເມື່ອແອດມິນແກ້ໄຂການຕັ້ງຄ່າໃນຫ້ອງຄວບຄຸມ ໜ້ານີ້ຈະປ່ຽນຕາມທັນທີໂດຍບໍ່ຕ້ອງ refresh
  if (typeof supabaseClient !== 'undefined') {
    supabaseClient
      .channel('public:site_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: SITE_SETTINGS_TABLE }, () => {
        applySiteSettings();
      })
      .subscribe();
  }

  window.addEventListener('resize', () => { restartAnnounceMarquee(); });
});
