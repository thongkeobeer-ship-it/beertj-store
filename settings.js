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
  qr_url_2: null,
  qr_label: null,
  qr_label_2: null,
  category_1_name: 'ໝວດໝູ່ 1',
  category_2_name: 'ໝວດໝູ່ 2',
  category_3_name: 'ໝວດໝູ່ 3',
  category_4_name: 'ໝວດໝູ່ 4',
  category_5_name: 'ໝວດໝູ່ 5',
  category_6_name: 'ໝວດໝູ່ 6',
  category_7_name: 'ໝວດໝູ່ 7',
  category_8_name: 'ໝວດໝູ່ 8',
  category_9_name: 'ໝວດໝູ່ 9',
  category_10_name: 'ໝວດໝູ່ 10',
  category_1_image: null,
  category_2_image: null,
  category_3_image: null,
  category_4_image: null,
  category_5_image: null,
  category_6_image: null,
  category_7_image: null,
  category_8_image: null,
  category_9_image: null,
  category_10_image: null,
  // ຮູບ hero ໜ້າຫຼັກ (ຖ້າແອດມິນອັບໂຫລດໄວ້ ຈະໃຊ້ຮູບນີ້ແທນວິດີໂອ hero-live.mp4 ຄ່າເລີ່ມຕົ້ນ)
  hero_image: null,
  // ລິ້ງຊ່ອງທາງໂຊເຊียล — ແກ້ໄຂໄດ້ຈາກຫ້ອງຄວບຄຸມແອດມິນ > ຕັ້ງຄ່າຮ້ານ > ຊ່ອງທາງໂຊເຊียລ
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
// ຮອງຮັບ QR ໄດ້ 2 ອັນ: qr_url/qr_label (ອັນທີ 1, ສະແດງສະເໝີ) ແລະ qr_url_2/qr_label_2 (ອັນທີ 2, ສະແດງສະເພາະຖ້າແອດມິນໃສ່ຮູບໄວ້)
function applyQr(settings) {
  const img = document.getElementById('qrImage');
  if (settings.qr_url && img) {
    img.src = settings.qr_url;
    img.style.display = '';
    const fallback = document.getElementById('qrFallback');
    if (fallback) fallback.style.display = 'none';
  }
  const label1 = document.getElementById('qrLabel1');
  if (label1) {
    if (settings.qr_label) { label1.textContent = settings.qr_label; label1.style.display = ''; }
    else { label1.style.display = 'none'; }
  }

  const col2 = document.getElementById('qrCol2');
  const img2 = document.getElementById('qrImage2');
  const label2 = document.getElementById('qrLabel2');
  if (col2 && img2) {
    if (settings.qr_url_2) {
      img2.src = settings.qr_url_2;
      col2.style.display = '';
      if (label2) {
        if (settings.qr_label_2) { label2.textContent = settings.qr_label_2; label2.style.display = ''; }
        else { label2.style.display = 'none'; }
      }
    } else {
      col2.style.display = 'none';
    }
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

// ---------- ໝວດໝູ່ (ສ້າງ card ໝວດໝູ່ 1-10 ແບບ dynamic) ----------
// ໂຊວ໌ຮູບພາບ (ຖ້າແອດມິນອັບໂຫລດໄວ້) ແລະ ຊື່ໝວດໝູ່ຢູ່ເທິງ card — ຍັງກົດເພື່ອກັ່ນຕອງສິນຄ້າຕາມໝວດໄດ້ຄືເກົ່າ
function renderCategoryCards(settings) {
  const container = document.getElementById('categoryCardsDynamic');
  if (!container) return;

  // ຮັກສາໝວດໝູ່ທີ່ກຳລັງເລືອກຢູ່ໄວ້ (ຖ້າມີ) ເຜື່ອຕອນ re-render ຫຼັງແອດມິນແກ້ໄຂການຕັ້ງຄ່າແບບສົດໆ
  const prevActive = container.querySelector('.cat-card.is-active');
  const prevActiveCategory = prevActive ? prevActive.dataset.category : null;

  let html = '';
  for (let i = 1; i <= 10; i++) {
    const name = String(settings[`category_${i}_name`] || `ໝວດໝູ່ ${i}`);
    const safeName = name.replace(/"/g, '&quot;');
    const image = settings[`category_${i}_image`];
    const isActive = (prevActiveCategory && prevActiveCategory === name) ? ' is-active' : '';
    const hasImageClass = image ? ' has-image' : '';
    const imgHtml = image ? `<img class="cat-card-media" src="${image}" alt="${safeName}">` : '';
    html += `<div class="cat-card${isActive}${hasImageClass}" data-category="${safeName}" data-cat-slot="${i}">${imgHtml}<h3 class="shine-text">${safeName}</h3></div>`;
  }
  container.innerHTML = html;

  // ຜູກ event ຄລິກໃສ່ card ໃໝ່ (ຟັງຊັນນີ້ຢູ່ script.js, ຮອງຮັບການເອີ້ນຊ້ຳຫຼາຍຄັ້ງໄດ້ຢ່າງປອດໄພ)
  if (typeof buildCategoryFilter === 'function') buildCategoryFilter();
}

// ---------- ຮູບ hero ໜ້າຫຼັກ (ຖ້າແອດມິນອັບໂຫລດຮູບໄວ້ ຈະໃຊ້ຮູບແທນວິດີໂອ hero-live.mp4 ຄ່າເລີ່ມຕົ້ນ) ----------
function applyHeroImage(url) {
  const video = document.getElementById('heroLiveVideo');
  const img = document.getElementById('heroImageCustom');
  if (!video || !img) return;
  if (url) {
    img.src = url;
    img.style.display = '';
    video.style.display = 'none';
    video.pause();
  } else {
    img.style.display = 'none';
    img.removeAttribute('src');
    video.style.display = '';
    video.play().catch(() => {});
  }
}

async function applySiteSettings() {
  const settings = await fetchSiteSettings();
  window.currentSiteSettings = settings;

  applyLogo(settings.logo_url);
  applyStoreName(settings.store_name);
  applyTagline(settings.tagline);
  applyAnnouncement(settings.announcement_text);
  applyQr(settings);
  renderCategoryCards(settings);
  applyHeroImage(settings.hero_image);
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
//
// ຖ້າຍັງບໍ່ມີຄໍລຳ QR ອັນທີ 2 ແລະ ຂໍ້ຄວາມກຳກັບ QR ໃຫ້ແລ່ນຄຳສັ່ງນີ້ນຳ:
// alter table site_settings add column if not exists qr_url_2   text;
// alter table site_settings add column if not exists qr_label   text;
// alter table site_settings add column if not exists qr_label_2 text;
//
// ຖ້າຍັງບໍ່ມີຄໍລຳຮູບ hero ໜ້າຫຼັກ ໃຫ້ແລ່ນຄຳສັ່ງນີ້ນຳ:
// alter table site_settings add column if not exists hero_image text;
// ============================================
