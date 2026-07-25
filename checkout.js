// ໂຕລະຄະຂອງໜ້າຢືນຢັນການສັ່ງຊື້ — ດຶງຂໍ້ມູນສິນຄ້າຈິງຈາກ Supabase ແລະ ເຄລມລະຫັດຈິງເມື່ອຢືນຢັນ

function formatBaht(n) {
  return '฿' + Number(n || 0).toLocaleString('th-TH');
}

document.addEventListener('DOMContentLoaded', async () => {

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const loadingNote = document.getElementById('loadingNote');
  const orderContent = document.getElementById('orderContent');

  if (!productId) {
    loadingNote.textContent = 'ບໍ່ພົບສິນຄ້າທີ່ຈະສັ່ງຊື້';
    return;
  }

  const { data: product, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error || !product) {
    loadingNote.textContent = 'ບໍ່ພົບສິນຄ້ານີ້ ອາດຖືກລຶບໄປແລ້ວ';
    return;
  }

  const { data: stockCount } = await supabaseClient.rpc('product_stock', { p_product_id: productId });
  const stock = stockCount ?? 0;

  loadingNote.style.display = 'none';
  orderContent.style.display = 'block';

  const orderThumb = document.getElementById('orderThumb');
  const orderName = document.getElementById('orderName');
  const orderMeta = document.getElementById('orderMeta');
  const unitPriceEl = document.getElementById('unitPrice');
  const qtyDisplayEl = document.getElementById('qtyDisplay');
  const totalPriceEl = document.getElementById('totalPrice');
  const qtyValueEl = document.getElementById('qtyValue');
  const orderIdEl = document.getElementById('orderId');

  if (product.image_url) {
    orderThumb.style.backgroundImage = `url(${product.image_url})`;
    orderThumb.style.backgroundSize = 'cover';
    orderThumb.style.backgroundPosition = 'center';
    orderThumb.textContent = '';
  }
  orderName.textContent = product.name;
  orderMeta.textContent = `${product.category || 'ໝວດໝູ່ສິນຄ້າ'} • ຄົງເຫຼືອ ${stock}`;
  unitPriceEl.textContent = formatBaht(product.price);

  let qty = 1;
  const maxQty = Math.max(1, stock || 1);

  function renderTotals() {
    qtyValueEl.textContent = qty;
    qtyDisplayEl.textContent = `x${qty}`;
    totalPriceEl.textContent = formatBaht(product.price * qty);
  }
  renderTotals();

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

  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (document.referrer) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  const orderCode = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  if (orderIdEl) orderIdEl.textContent = `ລະຫັດການສັ່ງຊື້: ${orderCode}`;

  const confirmBtn = document.getElementById('confirmBtn');
  const successOverlay = document.getElementById('successOverlay');
  const successClose = document.getElementById('successClose');
  const successText = document.getElementById('successText');
  const codeDisplay = document.getElementById('codeDisplay');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'ກຳລັງດຳເນີນການ...';

      try {
        // ດຶງລະຫັດສິນຄ້າມາໃຫ້ທີລະ 1 ລະຫັດຕໍ່ຈຳນວນທີ່ສັ່ງ (ກັນການເຄລມຊ້ຳກັນດ້ວຍຟັງຊັນຝັ່ງຖານຂໍ້ມູນ)
        const claimedCodes = [];
        for (let i = 0; i < qty; i++) {
          const { data: code, error: claimError } = await supabaseClient.rpc('claim_product_code', {
            p_product_id: productId
          });
          if (claimError) throw claimError;
          claimedCodes.push(code);
        }

        successText.textContent = 'ຂອບໃຈສຳລັບການສັ່ງຊື້ ນີ້ແມ່ນລະຫັດຂອງທ່ານ:';
        codeDisplay.style.display = 'block';
        codeDisplay.textContent = claimedCodes.join(', ');
        successOverlay.classList.add('show');
      } catch (err) {
        console.error(err);
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'ຢືນຢັນການສັ່ງຊື້';
        alert('ບໍ່ສາມາດຢືນຢັນການສັ່ງຊື້ໄດ້: ' + (err.message || 'ລະຫັດສິນຄ້າອາດໝົດແລ້ວ'));
      }
    });
  }
  if (successClose) {
    successClose.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

});
