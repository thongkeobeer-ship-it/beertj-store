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

});
