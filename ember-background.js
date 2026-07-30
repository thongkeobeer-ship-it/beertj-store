// ==================================================================
// ember-background.js — พื้นหลังสีดำ/เทาเข้ม + ฟ้าผ่าสีทอง (ผ่าทุกๆ ~3 วิ
// แล้วจางหาย) ผสมฝุ่นประกายทองลอยเบาๆ ให้บรรยากาศดูดราม่า หรูหรา มีชีวิตชีวา
//
// หมายเหตุ: กันไม่ให้ฟ้าผ่า/แสงวาบไปโผล่ทะลุแถบเมนูด้านบน (navbar) โดยเว้น
// แถบบนสุดของจอไว้เป็น "เขตปลอดภัย" ไม่วาดอะไรใส่ตรงนั้นเลย (SAFE_TOP)
// ฝั่ง navbar เองก็ทำพื้นหลังให้ทึบสนิทเพิ่มอีกชั้นด้วย กันไว้สองชั้น
//
// วิธีใช้: ใส่ tag นี้ไว้ในหน้า HTML (ตำแหน่งไหนก็ได้ใน <body>):
//     <script src="ember-background.js"></script>
// สคริปต์จะสร้าง <canvas> เต็มจอเองอัตโนมัติ ไม่บังการคลิก/แตะ
// ==================================================================
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  canvas.id = 'emberBackground';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '0',
    pointerEvents: 'none',
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

  // ເຂດປອດໄພເທິງສຸດຂອງຈໍ (px) — ບໍ່ແຕ້ມຟ້າຜ່າ/ແສງວາບ/ຝຸ່ນຢູ່ບ່ອນນີ້ເລີຍ
  // ເພື່ອບໍ່ໃຫ້ໂຜ່ທະລຸ navbar (navbar ປົກກະຕິສູງປະມານ 78-90px + ຫ່າງຂອບເທິງ 20px)
  const SAFE_TOP = 132;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

  // ==== พื้นหลัง: ดำ + เทาเข้มไล่เฉด นวลๆ ====
  let bgGradient = null;
  function buildBackgroundGradient() {
    const g = ctx.createRadialGradient(
      width * 0.5, height * 0.55, 0,
      width * 0.5, height * 0.55, Math.max(width, height) * 0.75
    );
    g.addColorStop(0, '#1a1816');
    g.addColorStop(0.45, '#100f0e');
    g.addColorStop(1, '#000000');
    bgGradient = g;
  }
  buildBackgroundGradient();
  window.addEventListener('resize', buildBackgroundGradient);

  // ================================================================
  // ==== ฝุ่นประกายทองลอยเบาๆ (ambient dust) — บรรยากาศพื้นหลังเบาๆ ====
  // ================================================================
  const GOLD_SHADES = ['255,236,190', '255,214,140', '255,186,90', '250,160,55'];
  const DUST_COUNT = 26;
  const dust = [];

  function spawnDust(startMidLife) {
    const maxLife = rand(5000, 10000);
    return {
      x: rand(0, width),
      y: height + rand(10, 80),
      radius: rand(0.9, 2.4),
      color: pick(GOLD_SHADES),
      speedY: rand(0.012, 0.032),
      driftAmp: rand(6, 20),
      driftFreq: rand(0.0007, 0.0018),
      driftPhase: rand(0, Math.PI * 2),
      life: startMidLife ? rand(0, maxLife) : 0,
      maxLife,
      fadeIn: rand(400, 800),
      fadeOut: rand(1000, 2000),
    };
  }
  for (let i = 0; i < DUST_COUNT; i++) dust.push(spawnDust(true));

  function dustOpacity(d) {
    if (d.life < d.fadeIn) return easeOutQuad(d.life / d.fadeIn);
    if (d.life > d.maxLife - d.fadeOut) {
      const t = (d.life - (d.maxLife - d.fadeOut)) / d.fadeOut;
      return 1 - easeOutQuad(Math.max(0, Math.min(1, t)));
    }
    return 1;
  }

  function updateDust(d, dt, i) {
    d.life += dt;
    d.y -= d.speedY * dt;
    d.x += Math.sin(d.life * d.driftFreq + d.driftPhase) * (d.driftAmp * 0.0018 * dt);
    if (d.life >= d.maxLife || d.y < SAFE_TOP - 20) { dust[i] = spawnDust(false); return; }
    if (d.y < SAFE_TOP) return; // ຢູ່ໃນເຂດປອດໄພ -> ຂ້າມການແຕ້ມ (ແຕ່ຍັງອັບເດດຕຳແໜ່ງໄວ້)
    const o = dustOpacity(d) * 0.35;
    if (o <= 0.01) return;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${d.color},${o.toFixed(3)})`;
    ctx.shadowColor = `rgba(${d.color},${(o * 0.8).toFixed(3)})`;
    ctx.shadowBlur = d.radius * 3;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ================================================================
  // ==== ฟ้าผ่าสีทอง — ผ่าลงมาแบบสุ่มแตกกิ่ง ทุกๆ ~3 วินาที แล้วจางหาย ====
  // ================================================================
  const bolts = [];
  let flashIntensity = 0;
  let nextStrikeAt = rand(1200, 2600);
  let clock = 0;

  function buildBoltSegments(x1, y1, x2, y2, disp, segments, depth, branchChance) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist < 18 || depth > 9) {
      segments.push({ x1, y1, x2, y2 });
      return;
    }
    const midX = (x1 + x2) / 2 + rand(-disp, disp);
    const midY = (y1 + y2) / 2 + rand(-disp * 0.35, disp * 0.35);

    buildBoltSegments(x1, y1, midX, midY, disp * 0.55, segments, depth + 1, branchChance);
    buildBoltSegments(midX, midY, x2, y2, disp * 0.55, segments, depth + 1, branchChance);

    if (Math.random() < branchChance && depth < 6) {
      const angle = Math.atan2(y2 - y1, x2 - x1) + rand(-1.1, 1.1);
      const branchLen = dist * rand(0.25, 0.55);
      const bx = midX + Math.cos(angle) * branchLen;
      const by = midY + Math.sin(angle) * branchLen + branchLen * 0.4;
      const branchSegs = [];
      buildBoltSegments(midX, midY, bx, by, disp * 0.5, branchSegs, depth + 2, branchChance * 0.4);
      branchSegs.forEach((s) => segments.push(Object.assign(s, { isBranch: true })));
    }
  }

  // ຟ້າຜ່າຈະເລີ່ມຕົ້ນຢູ່ຫຼັງເຂດປອດໄພ (SAFE_TOP) ສະເໝີ ບໍ່ແມ່ນເລີ່ມຈາກຂອບເທິງສຸດຂອງຈໍ
  function spawnBolt() {
    const startX = rand(width * 0.15, width * 0.85);
    const endX = startX + rand(-width * 0.18, width * 0.18);
    const startY = SAFE_TOP + rand(0, 30);
    const endY = SAFE_TOP + (height - SAFE_TOP) * rand(0.5, 0.9);
    const segments = [];
    buildBoltSegments(startX, startY, endX, endY, width * 0.09, segments, 0, 0.55);

    bolts.push({
      segments,
      life: 0,
      flashDur: rand(60, 110),
      holdDur: rand(50, 120),
      fadeDur: rand(500, 850),
    });

    if (Math.random() < 0.25) {
      const startX2 = rand(width * 0.1, width * 0.9);
      const endX2 = startX2 + rand(-width * 0.15, width * 0.15);
      const startY2 = SAFE_TOP + rand(0, 30);
      const endY2 = SAFE_TOP + (height - SAFE_TOP) * rand(0.4, 0.85);
      const segments2 = [];
      buildBoltSegments(startX2, startY2, endX2, endY2, width * 0.07, segments2, 0, 0.45);
      bolts.push({
        segments: segments2,
        life: 0,
        flashDur: rand(60, 110),
        holdDur: rand(40, 90),
        fadeDur: rand(400, 700),
      });
    }

    flashIntensity = 1;
  }

  function boltOpacity(b) {
    if (b.life < b.flashDur) return easeOutQuad(b.life / b.flashDur);
    if (b.life < b.flashDur + b.holdDur) return 1;
    const t = (b.life - b.flashDur - b.holdDur) / b.fadeDur;
    return Math.max(0, 1 - easeOutQuad(Math.min(1, t)));
  }

  function drawBolt(b) {
    const o = boltOpacity(b);
    if (o <= 0.01) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    b.segments.forEach((s) => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
    ctx.strokeStyle = `rgba(255,196,90,${(0.5 * o).toFixed(3)})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = `rgba(255,196,90,${(0.9 * o).toFixed(3)})`;
    ctx.shadowBlur = 28;
    ctx.stroke();

    ctx.beginPath();
    b.segments.forEach((s) => {
      ctx.lineWidth = s.isBranch ? 1.1 : 2;
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    });
    ctx.strokeStyle = `rgba(255,214,110,${o.toFixed(3)})`;
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgba(255,196,90,${o.toFixed(3)})`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function updateBolts(dt) {
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.life += dt;
      drawBolt(b);
      if (b.life >= b.flashDur + b.holdDur + b.fadeDur) bolts.splice(i, 1);
    }
  }

  // ແສງວາບທົ່ວຈໍ — ເລີ່ມຕົ້ນຕ່ຳກວ່າ SAFE_TOP ສະເໝີ ບໍ່ໃຫ້ແສງເຫຼືອບຂຶ້ນໄປໂຄ້ງຂອບເທິງ
  function drawScreenFlash() {
    if (flashIntensity <= 0.01) return;
    const centerY = SAFE_TOP + (height - SAFE_TOP) * 0.28;
    const g = ctx.createRadialGradient(
      width * 0.5, centerY, 0,
      width * 0.5, centerY, Math.max(width, height) * 0.85
    );
    g.addColorStop(0, `rgba(255,205,110,${(0.16 * flashIntensity).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, SAFE_TOP, width, height - SAFE_TOP);
    flashIntensity = Math.max(0, flashIntensity - 0.05);
  }

  let lastTime = performance.now();
  let rafId = null;

  function drawFrame(time) {
    const dt = Math.min(time - lastTime, 50);
    lastTime = time;
    clock += dt;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (!prefersReducedMotion) {
      // ຕັດຂອບ (clip) ບໍ່ໃຫ້ຟ້າຜ່າ/ແສງວາບ/ຝຸ່ນ ແຕ້ມເຂົ້າໄປໃນເຂດປອດໄພ SAFE_TOP ໄດ້ເລີຍ
      // (ພື້ນຫຼັງສີດຳ/ເທົາຍັງແຕ້ມເຕັມຈໍປົກກະຕິ ແຄ່ຕົວເອຟເຟັກເທົ່ານັ້ນທີ່ຖືກກັນໄວ້)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, SAFE_TOP, width, Math.max(0, height - SAFE_TOP));
      ctx.clip();

      dust.forEach((d, i) => updateDust(d, dt, i));

      if (clock >= nextStrikeAt) {
        spawnBolt();
        clock = 0;
        nextStrikeAt = rand(2500, 3600);
      }
      drawScreenFlash();
      updateBolts(dt);

      ctx.restore();

      rafId = requestAnimationFrame(drawFrame);
    } else {
      spawnBolt();
      updateBolts(0);
      bolts.forEach((b) => { b.life = b.flashDur + b.holdDur; drawBolt(b); });
    }
  }

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

  requestAnimationFrame(drawFrame);
})();
