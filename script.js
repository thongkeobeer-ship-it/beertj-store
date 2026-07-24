// ตัวอย่าง JavaScript พื้นฐาน — แก้ไข/เพิ่มเติมได้ตามต้องการ

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
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
}

document.addEventListener('DOMContentLoaded', () => {

  // ปุ่มเมนู (แฮมเบอร์เกอร์)
  const menuBtn = document.querySelector('.menu-btn');
  if(menuBtn){
    menuBtn.addEventListener('click', () => {
      showToast('เปิดเมนู (ใส่โค้ดเมนูของคุณตรงนี้)');
    });
  }

  // ปุ่ม CTA หลัก/รอง
  const ctaButtons = document.querySelectorAll('.cta-row .btn');
  ctaButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`กดปุ่ม: ${btn.textContent.trim()}`);
    });
  });

  // การ์ดหมวดหมู่
  const catCards = document.querySelectorAll('.cat-card');
  catCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('h3')?.textContent || 'หมวดหมู่';
      showToast(`เปิดหมวดหมู่: ${title}`);
    });
  });

  // ปุ่มสั่งซื้อ
  const buyButtons = document.querySelectorAll('.buy-btn');
  buyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('เพิ่มลงตะกร้าแล้ว');
    });
  });

  // ปุ่ม "ดูทั้งหมด" / "ดูเพิ่มเติม"
  const seeAllButtons = document.querySelectorAll('.see-all');
  seeAllButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('ไปยังหน้ารายการทั้งหมด');
    });
  });

  // === การ์ดสินค้า: เอฟเฟกต์เข้าฉากแบบมีมิติ + ลอยตัวเบาๆ ===
  const productCards = document.querySelectorAll('.product-card');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  productCards.forEach((card, i) => {
    // หน่วงเวลาแบบวนซ้ำ 6 จังหวะ ให้การ์ดทยอยโผล่ไม่พร้อมกัน
    card.style.setProperty('--reveal-delay', `${(i % 6) * 0.09}s`);
    const mediaSlot = card.querySelector('.product-media');
    if (mediaSlot) mediaSlot.style.setProperty('--sweep-delay', `${(i % 7) * 0.7}s`);
  });

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

    productCards.forEach(card => revealObserver.observe(card));

    // เอียงเบาๆ ตามตำแหน่งบนจอขณะเลื่อน ให้ดูมีมิติต่อเนื่อง ไม่นิ่ง
    let ticking = false;
    const updateTilt = () => {
      const vh = window.innerHeight;
      productCards.forEach(card => {
        if (!card.classList.contains('in-view')) return;
        const rect = card.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return; // ข้ามการ์ดที่อยู่ไกลจอมาก
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) / vh; // ประมาณ -0.6 ถึง 0.6
        const rotate = Math.max(Math.min(offset * -12, 10), -10);
        const scale = 1 - Math.min(Math.abs(offset), 0.45) * 0.06;
        card.style.transform = `perspective(900px) rotateX(${rotate}deg) scale(${scale})`;
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateTilt);
        ticking = true;
      }
    }, { passive: true });

    updateTilt();
  }

});
