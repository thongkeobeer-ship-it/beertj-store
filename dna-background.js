// ==================================================================
// dna-background.js — ພື້ນຫຼັງເສັ້ນ DNA ແບບ 3 ມິຕິ ໝູນ+ລອຍຊ້າໆຕະຫຼອດເວລາ
// ໂຕນສີ: ຂາວ / ຟ້າ / ຟ້າເຮືອງແສງ ໃສ່ພື້ນຫຼັງດຳ-ເທົາ
//
// ວິທີໃຊ້: ໃສ່ tag ນີ້ໄວ້ໃນທຸກໜ້າ HTML ຂອງເວັບ (ບ່ອນໃດກໍ່ໄດ້ໃນ <body>,
// ບໍ່ຈຳເປັນຕ້ອງຢູ່ກ່ອນ script ອື່ນ):
//     <script src="dna-background.js"></script>
// ບໍ່ຕ້ອງແກ້ໄຂຫຍັງອີກ — script ຈະສ້າງ <canvas> ແລະ ຈັດການທຸກຢ່າງເອງ,
// ບໍ່ລົບກວນການຄລິກ/ແຕະໃນໜ້າ (pointer-events ປິດໄວ້) ແລະ ບໍ່ດຶງຄວາມສົນໃຈ
// ຈາກເນື້ອຫາຫຼັກ (ຄວາມໂປ່ງໃສຕໍ່າ + ຢູ່ຫຼັງສຸດ z-index:0)
// ==================================================================
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.id = 'dnaBackground';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '0',
    pointerEvents: 'none',
    opacity: '0.5',
    display: 'block',
  });

  function mount() {
    if (document.body.firstChild) {
      document.body.insertBefore(canvas, document.body.firstChild);
    } else {
      document.body.appendChild(canvas);
    }
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0;
  let height = 0;
  let helixRadius = 120;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // ຫົດລັດສະໝີການໝູນລົງໃນຈໍແຄບ (ມືຖື) ບໍ່ໃຫ້ລົ້ນຂອບຈໍ
    helixRadius = Math.max(66, Math.min(150, width * 0.28));
  }
  resize();
  window.addEventListener('resize', resize);

  // ==== ຄ່າຄວບຄຸມຮູບຊົງ/ຄວາມໄວ DNA (ປັບໄດ້ຕາມໃຈ) ====
  const POINTS = 40;             // ຈຳນວນຄູ່ຖານໃນເສັ້ນ DNA — ຫຼາຍຂຶ້ນ = ລະອຽດຂຶ້ນແຕ່ໜັກຂຶ້ນ
  const VERTICAL_GAP = 30;       // ໄລຍະຫ່າງລະຫວ່າງຄູ່ຖານແຕ່ລະຄູ່ (px)
  const TURNS = 3;               // ຈຳນວນຮອບບິດຕະຫຼອດຄວາມສູງ
  const ROTATE_SPEED = 0.00020;  // ຄວາມໄວການໝູນອ້ອມແກນ (ຊ້າໆ)
  const FLOAT_SPEED = 0.00012;   // ຄວາມໄວການລອຍຂຶ້ນລົງຊ້າໆ
  const FLOAT_RANGE = 36;        // ໄລຍະລອຍຂຶ້ນລົງ (px)
  const PERSPECTIVE = 560;

  const STRAND_A_RGB = '125,211,252'; // ຟ້າອ່ອນເຮືອງແສງ (sky)
  const STRAND_B_RGB = '96,165,250';  // ຟ້າເຂັ້ມກວ່າ (blue)
  const RUNG_RGB = '203,225,255';     // ຄູ່ຮາງເຊື່ອມ — ຂາວອົມຟ້າອ່ອນໆ

  let rotation = Math.random() * Math.PI * 2;
  let floatOffset = 0;
  let lastTime = performance.now();
  let rafId = null;

  function mapRange(v, inMin, inMax, outMin, outMax) {
    const t = (v - inMin) / (inMax - inMin);
    const clamped = Math.max(0, Math.min(1, t));
    return outMin + clamped * (outMax - outMin);
  }

  function drawStrand(points, rgb) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // ເສັ້ນສາຍ DNA (ຕໍ່ຈຸດຕໍ່ຈຸດ ໃຫ້ເບິ່ງຄ້າຍເສັ້ນໂຄ້ງດຽວ)
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = `rgba(${rgb},0.4)`;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = `rgba(${rgb},0.6)`;
    ctx.shadowBlur = 7;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ຈຸດຖານແຕ່ລະຈຸດ — ຈຸດທີ່ຢູ່ໃກ້ "ກ້ອງ" ຫຼາຍກວ່າຈະໃຫຍ່ ແລະ ແຈ້ງກວ່າ (ຄວາມຮູ້ສຶກ 3D)
    points.forEach((p) => {
      const depthFactor = mapRange(p.z, -helixRadius, helixRadius, 0.3, 1);
      const r = 2.3 * p.scale;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${(0.4 * depthFactor).toFixed(3)})`;
      ctx.fill();
    });
  }

  function drawFrame(time) {
    const dt = Math.min(time - lastTime, 50); // ກັນຄ່າກະໂດດຖ້າສະລັບແທັບກັບມາ
    lastTime = time;
    rotation += ROTATE_SPEED * dt;
    floatOffset += FLOAT_SPEED * dt;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const totalHeight = POINTS * VERTICAL_GAP;
    const floatCycle = Math.sin(floatOffset) * FLOAT_RANGE;

    const strandA = [];
    const strandB = [];

    for (let i = 0; i < POINTS; i++) {
      const t = i / (POINTS - 1);
      const angle = t * Math.PI * 2 * TURNS + rotation;
      const y = centerY - totalHeight / 2 + i * VERTICAL_GAP + floatCycle;

      const xA = Math.cos(angle) * helixRadius;
      const zA = Math.sin(angle) * helixRadius;
      const xB = Math.cos(angle + Math.PI) * helixRadius;
      const zB = Math.sin(angle + Math.PI) * helixRadius;

      const scaleA = PERSPECTIVE / (PERSPECTIVE + zA);
      const scaleB = PERSPECTIVE / (PERSPECTIVE + zB);

      strandA.push({ x: centerX + xA * scaleA, y, z: zA, scale: scaleA });
      strandB.push({ x: centerX + xB * scaleB, y, z: zB, scale: scaleB });
    }

    // ຄູ່ຮາງເຊື່ອມ (base pairs) —ແຕ້ມກ່ອນ ໃຫ້ຢູ່ຫຼັງເສັ້ນສາຍ
    for (let i = 0; i < POINTS; i += 2) {
      const a = strandA[i];
      const b = strandB[i];
      const depth = (a.z + b.z) / 2;
      const alpha = mapRange(depth, -helixRadius, helixRadius, 0.05, 0.26);
      ctx.strokeStyle = `rgba(${RUNG_RGB},${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    drawStrand(strandA, STRAND_A_RGB);
    drawStrand(strandB, STRAND_B_RGB);

    if (!prefersReducedMotion) {
      rafId = requestAnimationFrame(drawFrame);
    }
  }

  // ຢຸດແອນິເມຊັນເມື່ອສະລັບແທັບ/ຫຍໍ້ໜ້າຈໍ (ປະຢັດແບັດເຕີຣີ) ແລ້ວແລ່ນຕໍ່ອັດຕະໂນມັດຕອນກັບມາ
  document.addEventListener('visibilitychange', () => {
    if (prefersReducedMotion) return;
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (rafId === null) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(drawFrame);
    }
  });

  // ຄົນທີ່ຕັ້ງຄ່າ "ຫຼຸດການເຄື່ອນໄຫວ" ໃນເຄື່ອງ -> ແຕ້ມແຄ່ພຽງເຟຣມດຽວແບບນິ່ງ (ຍັງເຫັນ DNA ແຕ່ບໍ່ໝູນ)
  requestAnimationFrame(drawFrame);
})();
