// ============================================
// ເມນູແບບເລື່ອນອອກຈາກຂວາ (side menu) — ໃຊ້ຮ່ວມກັນທຸກໜ້າທີ່ມີ
// #menuBtn / #menuOverlay / #sideMenu ຢູ່ໃນ HTML
// ຕ້ອງ include ຫຼັງ auth.js (ໃຊ້ getCurrentUser / isAdmin / signOut / getWalletBalance)
// ============================================

function closeSideMenu() {
  const overlay = document.getElementById('menuOverlay');
  const panel = document.getElementById('sideMenu');
  const menuBtn = document.getElementById('menuBtn');
  if (overlay) overlay.classList.remove('show');
  if (panel) {
    panel.classList.remove('show');
    panel.setAttribute('aria-hidden', 'true');
  }
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function openSideMenu() {
  const overlay = document.getElementById('menuOverlay');
  const panel = document.getElementById('sideMenu');
  const menuBtn = document.getElementById('menuBtn');
  if (overlay) overlay.classList.add('show');
  if (panel) {
    panel.classList.add('show');
    panel.setAttribute('aria-hidden', 'false');
  }
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
  renderSideMenuUser();
}

// ອັບເດດສ່ວນຜູ້ໃຊ້ ແລະ ປຸ່ມແອດມິນ/ເຂົ້າ-ອອກລະບົບ ພາຍໃນເມນູ ໃຫ້ກົງກັບສະຖານະປັດຈຸບັນ
async function renderSideMenuUser() {
  const userSlot = document.getElementById('sideMenuUser');
  const footSlot = document.getElementById('sideMenuFoot');
  const adminLink = document.getElementById('sideMenuAdminLink');
  if (!userSlot || !footSlot) return;
  if (typeof getCurrentUser !== 'function') return;

  const user = await getCurrentUser();

  if (user) {
    const initial = user.email ? user.email.charAt(0).toUpperCase() : '?';
    let balance = 0;
    if (typeof getWalletBalance === 'function') {
      try { balance = await getWalletBalance(user.id); } catch (e) { balance = 0; }
    }
    const walletText = typeof formatKipWallet === 'function' ? formatKipWallet(balance) : balance;

    userSlot.innerHTML = `
      <div class="side-menu-avatar">${initial}</div>
      <div class="side-menu-email">${user.email || ''}</div>
      <div class="side-menu-wallet">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 15h.01"/></svg>
        ${walletText}
      </div>
    `;

    footSlot.innerHTML = `
      <button class="side-menu-link danger" id="sideMenuLogout" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        ອອກຈາກລະບົບ
      </button>
    `;
    const logoutBtn = document.getElementById('sideMenuLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof signOut === 'function') signOut();
      });
    }

    if (adminLink) {
      if (typeof isAdmin === 'function') {
        try {
          const admin = await isAdmin();
          adminLink.style.display = admin ? 'flex' : 'none';
        } catch (e) {
          adminLink.style.display = 'none';
        }
      } else {
        adminLink.style.display = 'none';
      }
    }
  } else {
    userSlot.innerHTML = `<div class="side-menu-guest">ເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງຍອດເງິນ ແລະ ປະຫວັດການສັ່ງຊື້</div>`;
    footSlot.innerHTML = `
      <a class="side-menu-link" href="login.html">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        ເຂົ້າສູ່ລະບົບ
      </a>
    `;
    if (adminLink) adminLink.style.display = 'none';
  }
}

function initSideMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('menuOverlay');
  const panel = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('sideMenuClose');
  if (!menuBtn || !overlay || !panel) return; // ໜ້ານີ້ບໍ່ມີເມນູ

  menuBtn.addEventListener('click', () => {
    const isOpen = panel.classList.contains('show');
    isOpen ? closeSideMenu() : openSideMenu();
  });
  overlay.addEventListener('click', closeSideMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeSideMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('show')) closeSideMenu();
  });

  // ປິດເມນູທຸກຄັ້ງທີ່ກົດລິ້ງໃນເມນູ (ຍົກເວັ້ນປຸ່ມອອກຈາກລະບົບ ຊຶ່ງຈັດການ redirect ເອງ)
  panel.querySelectorAll('a.side-menu-link').forEach((link) => {
    link.addEventListener('click', closeSideMenu);
  });

  // ຖ້າຢູ່ໜ້າຫຼັກຢູ່ແລ້ວ ໃຫ້ "ສິນຄ້າທັງໝົດ" ເລື່ອນຫາລາຍການສິນຄ້າແທນທີ່ຈະໂຫຼດໜ້າໃໝ່
  const productsLink = document.getElementById('sideMenuProductsLink');
  if (productsLink) {
    productsLink.addEventListener('click', (e) => {
      const onIndex = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname.endsWith('/');
      const grid = document.getElementById('productGrid');
      if (onIndex && grid) {
        e.preventDefault();
        closeSideMenu();
        setTimeout(() => grid.scrollIntoView({ behavior: 'smooth' }), 180);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initSideMenu);
