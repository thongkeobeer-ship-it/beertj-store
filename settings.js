// ============================================
// ການຕັ້ງຄ່າຮ້ານ (Site Settings) — ດຶງຈາກ Supabase ແລ້ວອັບເດດອົງປະກອບຕ່າງໆທົ່ວໜ້າເວັບ
// ຕ້ອງ include ຫຼັງ auth.js (ໃຊ້ supabaseClient) ແລະ ກ່ອນ menu.js / script.js / topup.js
// ຕ້ອງແລ່ນ site_settings_setup.sql ໃນ Supabase ກ່ອນ (ສ້າງຕາຕະລາງ site_settings)
// ຖ້າເພີ່ມຄໍລຳລິ້ງໂຊເຊียลໃໝ່ ຕ້ອງແລ່ນ ALTER TABLE ເພີ່ມ (ເບິ່ງລາຍລະອຽດທ້າຍໄຟລ໌ນີ້)
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
  category_3_name: 'ໝວດໝູ່ 3',
  // ລິ້ງຊ່ອງທາງໂຊເຊียລ — ແກ້ໄຂໄດ້ຈາກຫ້ອງຄວບຄຸມແອດມິນ > ຕັ້ງຄ່າຮ້ານ > ຊ່ອງທາງໂຊເຊียລ
  social_facebook: null,
  social_discord: null,
  social_line: null,
  social_telegram: null,
  social_whatsapp: null
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
// ໝາຍເຫດສຳຄັນ: ຊື່ຮ້ານທີ່ແອດມິນພິມ/ແປະໃສ່ໃນຫ້ອງຄວບຄຸມ ບາງເທື່ອເປັນ "ຟອນແຟນຊີ" ຈາກເວັບ/ແອັບແຕ່ງໂຕໜັງສື
// ມີ 2 ແບບຫຼັກ:
//   1) bold/italic unicode (ເຊັ່ນ 𝐘𝐔𝐌𝐈𝐍) — .normalize('NFKD') ແປງກັບເປັນໂຕປົກກະຕິໄດ້
//   2) small-caps/ໂຕລອກແບບຄ້າຍໂຕປົກກະຕິ (ເຊັ່ນ ʏᴜᴍɪɴ ຫຼື ѕ ຄີຣິນລິກປອມ) — ເປັນຄົນລະໂຕອັກສອນຈິງໆ
//      normalize ບໍ່ຊ່ວຍຫຍັງເລີຍ ຟອນເວັບບໍ່ມີໂຕນັ້ນ -> ຫາຍໄປທັງໝົດ (blank)
// ແກ້ໂດຍ: (1) normalize ກ່ອນ (ແກ້ແບບ 1 ໄດ້) (2) ຕັດໂຕທີ່ບໍ່ຢູ່ໃນຊຸດໂຕອັກສອນທີ່ຮູ້ຈັກອອກ (ແກ້ແບບ 2)
// (3) ຖ້າຕັດອອກຈົນວ່າງເປົ່າ -> ບໍ່ນຳໃຊ້ຄ່ານີ້ເລີຍ ປ່ອຍໃຫ້ໃຊ້ຊື່ default ໃນ HTML ແທນ (ບໍ່ໃຫ້ວ່າງເປົ່າອີກເດັດຂາດ)
const SAFE_NAME_CHARS_RE = /[^A-Za-z0-9\u0E00-\u0EFF\u4e00-\u9fff\s!@#$%^&*()\-_+=.,:;'"<>/\\|~`{}[\]?๐-๙]/g;

function sanitizeStoreName(name) {
  const normalized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // ຕັດ combining diacritical marks
  return normalized.replace(SAFE_NAME_CHARS_RE, '').replace(/\s+/g, ' ').trim();
}

function applyStoreName(rawName) {
  if (!rawName) return;
  const name = sanitizeStoreName(rawName);
  if (!name) return; // ຊື່ຫຼັງກັ່ນຕອງແລ້ວວ່າງເປົ່າ (ຟອນແຟນຊີທີ່ແປງກັບບໍ່ໄດ້) -> ໃຊ້ຊື່ default ໃນ HTML ຕໍ່ໄປ ບໍ່ໂຊວ໌ຫວ່າງເປົ່າ
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

// ---------- ຊ່ອງທາງໂຊເຊียล (footer) ----------
// ຫາທຸກ element ທີ່ມີ [data-social="facebook|discord|line|telegram|whatsapp"]
// ຖ້າແອດມິນຍັງບໍ່ໄດ້ໃສ່ລິ້ງ -> ເຊື່ອງໄອຄອນນັ້ນໄປເລີຍ (ບໍ່ໂຊວ໌ລິ້ງເປົ່າ "#")
function applySocialLinks(settings) {
  const map = {
    facebook: settings.social_facebook,
    discord: settings.social_discord,
    line: settings.social_line,
    telegram: settings.social_telegram,
    whatsapp: settings.social_whatsapp
  };
  Object.entries(map).forEach(([key, url]) => {
    document.querySelectorAll(`[data-social="${key}"]`).forEach((el) => {
      if (url) {
        el.href = url;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  });
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
  applySocialLinks(settings);

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

  // ============================================
  // ແກ້ອາການ "ຂໍ້ຄວາມປະກາດເລື່ອນກະຕຸກ" ຕອນໃຊ້ໃນມືຖື
  // ສາເຫດ: browser ມືຖື (ໂດຍສະເພາະ Safari iOS) ຈະຍິງ event 'resize' ຖີ່ໆ
  // ຕອນ scroll (ແຖບທີ່ຢູ່/ແຖບຢູ່ລ່າງເລື່ອນເຂົ້າ-ອອກ) ທັ້ງທີ່ຄວາມກວ້າງໜ້າຈໍບໍ່ໄດ້ປ່ຽນເລີຍ
  // ເຮັດໃຫ້ animation ຖືກຣີເຊັດຊ້ຳໆຈົນເບິ່ງຄືກະຕຸກ.
  // ແກ້ໂດຍ: (1) debounce ໃຫ້ແລ່ນຫຼັງຢຸດ resize 250ms (2) ຣີແລ່ນສະເພາະຕອນຄວາມກວ້າງປ່ຽນແທ້ໆ
  // ============================================
  let lastKnownWidth = window.innerWidth;
  let resizeDebounceTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeDebounceTimer);
    resizeDebounceTimer = setTimeout(() => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== lastKnownWidth) {
        lastKnownWidth = currentWidth;
        restartAnnounceMarquee();
      }
    }, 250);
  }, { passive: true });
});

// ============================================
// SQL ຖ້າຍັງບໍ່ມີຄໍລຳລິ້ງໂຊເຊียล ໃຫ້ແລ່ນຄຳສັ່ງນີ້ໃນ Supabase SQL editor ກ່ອນ:
//
// alter table site_settings add column if not exists social_facebook text;
// alter table site_settings add column if not exists social_discord  text;
// alter table site_settings add column if not exists social_line     text;
// alter table site_settings add column if not exists social_telegram text;
// alter table site_settings add column if not exists social_whatsapp text;
// ============================================
