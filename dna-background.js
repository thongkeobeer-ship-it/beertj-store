// ==================================================================
// dna-background.js — ພື້ນຫຼັງເສັ້ນ DNA ຫຼາຍໆເສັ້ນ (ນ້ອຍ) ລອຍໄປມາ, ຈາງຫາຍ
// ແລ້ວໂຜ່ຂຶ້ນມາໃໝ່ບ່ອນອື່ນຊ້ຳໆ ບໍ່ຢຸດ — ໂຕນສີ: ຂາວ / ຟ້າ / ຟ້າເຮືອງແສງ
//
// ວິທີໃຊ້: ໃສ່ tag ນີ້ໄວ້ໃນທຸກໜ້າ HTML ຂອງເວັບ (ບ່ອນໃດກໍ່ໄດ້ໃນ <body>):
//     <script src="dna-background.js"></script>
// ບໍ່ຕ້ອງແກ້ໄຂຫຍັງອີກ — script ຈະສ້າງ <canvas> ແລະ ຈັດການທຸກຢ່າງເອງ,
// ບໍ່ລົບກວນການຄລິກ/ແຕະ (pointer-events ປິດໄວ້) ແລະ ບໍ່ດຶງຄວາມສົນໃຈຈາກເນື້ອຫາຫຼັກ
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
    opacity: '0.55',
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

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ==== ຄ່າຄວບຄຸມພາບລວມ (ປັບໄດ້ຕາມໃຈ) ====
  const HELIX_COUNT = 7;         // ຈຳນວນເສັ້ນ DNA ນ້ອຍໆທີ່ລອຍຢູ່ພ້ອມກັນ
  const PERSPECTIVE = 420;

  const COLOR_PAIRS = [
    ['125,211,252', '96,165,250'],   // ຟ້າອ່ອນ + ຟ້າກາງ
    ['186,230,253', '59,130,246'],   // ຟ້າອ່ອນຫຼາຍ + ຟ້າເຂັ້ມ
    ['224,242,254', '56,189,248'],   // ຂາວອົມຟ້າ + ຟ້າເຮືອງແສງ
  ];
  const RUNG_RGB = '203,225,255';

  function rand(min, max) { return min + Math.random() * (max - min); }
  function mapRange(v, inMin, inMax, outMin, outMax) {
    const t = (v - inMin) / (inMax - inMin);
    const clamped = Math.max(0, Math.min(1, t));
    return outMin + clamped * (outMax - outMin);
  }
  // ease-in-out ງ່າຍໆ ສຳລັບການຈາງເຂົ້າ/ຈາງອອກ ໃຫ້ນຸ້ມນວນ ບໍ່ກະຕຸກ
  function easeInOut(t) { return t * t * (3 - 2 * t); }

  // ==== ສ້າງເສັ້ນ DNA ນ້ອຍໆໜຶ່ງເສັ້ນ ດ້ວຍຄ່າແບບສຸ່ມ (ຂະໜາດ/ຕຳແໜ່ງ/ຄວາມໄວ/ໄລຍະຊີວິດ) ====
  function spawnHelix(startMidLife) {
    const points = Math.round(rand(14, 20));
    const fadeIn = rand(1800, 2800);
    const hold = rand(3200, 5200);
    const fadeOut = rand(1800, 2800);
    const totalLife = fadeIn + hold + fadeOut;
    const colors = COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];

    return {
      x: rand(width * 0.08, width * 0.92),
      y: rand(height * 0.12, height * 0.88),
      radius: rand(26, 56),
      vgap: rand(11, 17),
      turns: rand(2, 3.2),
      points,
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(0.00018, 0.00042) * (Math.random() < 0.5 ? -1 : 1),
      driftX: rand(-0.006, 0.006),
      driftY: rand(-0.008, -0.002), // ລອຍຂຶ້ນເບົາໆເປັນສ່ວນຫຼາຍ
      colorA: colors[0],
      colorB: colors[1],
      life: startMidLife ? rand(0, totalLife) : 0,
      fadeIn,
      hold,
      fadeOut,
      totalLife,
    };
  }

  const helixes = [];
  for (let i = 0; i < HELIX_COUNT; i++) {
    helixes.push(spawnHelix(true)); // ເລີ່ມຕົ້ນໃຫ້ແຕ່ລະເສັ້ນຢູ່ຄົນລະຈັງຫວະ ບໍ່ຈາງພ້ອມກັນໝົດ
  }

  function currentOpacity(h) {
    if (h.life < h.fadeIn) return easeInOut(h.life / h.fadeIn);
    if (h.life < h.fadeIn + h.hold) return 1;
    const t = (h.life - h.fadeIn - h.hold) / h.fadeOut;
    return 1 - easeInOut(Math.max(0, Math.min(1, t)));
  }

  function drawHelix(h, dt) {
    if (!prefersReducedMotion) {
      h.life += dt;
      h.rotation += h.rotSpeed * dt;
      h.x += h.driftX * dt;
      h.y += h.driftY * dt;

      if (h.life >= h.totalLife) {
        Object.assign(h, spawnHelix(false)); // ຈາງໝົດແລ້ວ -> ໂຜ່ຂຶ້ນມາໃໝ່ບ່ອນອື່ນ
        return; // ຂ້າມການແຕ້ມເຟຣມນີ້ (ໂປ່ງໃສ 0 ຢູ່ແລ້ວ)
      }
    }

    const opacity = prefersReducedMotion ? 0.7 : currentOpacity(h);
    if (opacity <= 0.01) return;

    const totalHeight = h.points * h.vgap;
    const strandA = [];
    const strandB = [];

    for (let i = 0; i < h.points; i++) {
      const t = i / (h.points - 1);
      const angle = t * Math.PI * 2 * h.turns + h.rotation;
      const y = h.y - totalHeight / 2 + i * h.vgap;

      const xA = Math.cos(angle) * h.radius;
      const zA = Math.sin(angle) * h.radius;
      const xB = Math.cos(angle + Math.PI) * h.radius;
      const zB = Math.sin(angle + Math.PI) * h.radius;

      const scaleA = PERSPECTIVE / (PERSPECTIVE + zA);
      const scaleB = PERSPECTIVE / (PERSPECTIVE + zB);

      strandA.push({ x: h.x + xA * scaleA, y, z: zA, scale: scaleA });
      strandB.push({ x: h.x + xB * scaleB, y, z: zB, scale: scaleB });
    }

    // ຄູ່ຮາງເຊື່ອມ
    for (let i = 0; i < h.points; i += 2) {
      const a = strandA[i];
      const b = strandB[i];
      const depth = (a.z + b.z) / 2;
      const alpha = mapRange(depth, -h.radius, h.radius, 0.04, 0.22) * opacity;
      ctx.strokeStyle = `rgba(${RUNG_RGB},${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    drawStrand(strandA, h.colorA, h.radius, opacity);
    drawStrand(strandB, h.colorB, h.radius, opacity);
  }

  function drawStrand(points, rgb, radius, opacity) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = `rgba(${rgb},${(0.42 * opacity).toFixed(3)})`;
    ctx.lineWidth = 1.3;
    ctx.shadowColor = `rgba(${rgb},${(0.6 * opacity).toFixed(3)})`;
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    points.forEach((p) => {
      const depthFactor = mapRange(p.z, -radius, radius, 0.3, 1);
      const r = 1.9 * p.scale;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${(0.45 * depthFactor * opacity).toFixed(3)})`;
      ctx.fill();
    });
  }

  let lastTime = performance.now();
  let rafId = null;

  function drawFrame(time) {
    const dt = Math.min(time - lastTime, 50); // ກັນຄ່າກະໂດດຖ້າສະລັບແທັບກັບມາ
    lastTime = time;

    ctx.clearRect(0, 0, width, height);
    helixes.forEach((h) => drawHelix(h, dt));

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

  // ຄົນທີ່ຕັ້ງຄ່າ "ຫຼຸດການເຄື່ອນໄຫວ" ໃນເຄື່ອງ -> ແຕ້ມແຄ່ພຽງເຟຣມດຽວແບບນິ່ງ (ຍັງເຫັນ DNA ແຕ່ບໍ່ໝູນ/ບໍ່ຈາງ)
  requestAnimationFrame(drawFrame);
})();
