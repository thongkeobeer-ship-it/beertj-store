// ตรรกะของหน้ายืนยันคำสั่งซื้อ

function parsePrice(text) {
  const digits = (text || '').replace(/[^0-9.]/g, '');
  const n = parseFloat(digits);
  return isNaN(n) ? 0 : n;
}

function formatBaht(n) {
  return '฿' + n.toLocaleString('th-TH');
}

document.addEventListener('DOMContentLoaded', () => {

  // โหลดข้อมูลสินค้าที่เลือกไว้จากหน้าหลัก (เก็บผ่าน sessionStorage)
  let product = { name: 'ชื่อสินค้าตัวอย่าง', category: 'หมวดหมู่สินค้า', price: 0, stock: 10 };
  try {
    const stored = sessionStorage.getItem('selectedProduct');
    if (stored) product = { ...product, ...JSON.parse(stored) };
  } catch (e) { /* ใช้ค่าเริ่มต้นถ้าอ่านไม่ได้ */ }

  const orderName = document.getElementById('orderName');
  const orderMeta = document.getElementById('orderMeta');
  const unitPriceEl = document.getElementById('unitPrice');
  const qtyDisplayEl = document.getElementById('qtyDisplay');
  const totalPriceEl = document.getElementById('totalPrice');
  const qtyValueEl = document.getElementById('qtyValue');
  const orderIdEl = document.getElementById('orderId');

  if (orderName) orderName.textContent = product.name;
  if (orderMeta) orderMeta.textContent = `${product.category} • คงเหลือ ${product.stock}`;
  if (unitPriceEl) unitPriceEl.textContent = formatBaht(product.price);

  let qty = 1;
  const maxQty = Math.max(1, product.stock || 10);

  function renderTotals() {
    if (qtyValueEl) qtyValueEl.textContent = qty;
    if (qtyDisplayEl) qtyDisplayEl.textContent = `x${qty}`;
    if (totalPriceEl) totalPriceEl.textContent = formatBaht(product.price * qty);
  }
  renderTotals();

  // ปุ่มเพิ่ม/ลดจำนวน
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  if (qtyMinus) qtyMinus.addEventListener('click', () => {
    qty = Math.max(1, qty - 1);
    renderTotals();
  });
  if (qtyPlus) qtyPlus.addEventListener('click', () => {
    qty = Math.min(maxQty, qty + 1);
    renderTotals();
  });

  // ปุ่มย้อนกลับ
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (document.referrer) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  // สร้างเลขคำสั่งซื้อจำลอง
  const orderCode = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  if (orderIdEl) orderIdEl.textContent = `รหัสคำสั่งซื้อ: ${orderCode}`;

  // ปุ่มยืนยัน -> แสดงหน้าสำเร็จ
  const confirmBtn = document.getElementById('confirmBtn');
  const successOverlay = document.getElementById('successOverlay');
  const successClose = document.getElementById('successClose');

  if (confirmBtn && successOverlay) {
    confirmBtn.addEventListener('click', () => {
      successOverlay.classList.add('show');
    });
  }
  if (successClose) {
    successClose.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

});
