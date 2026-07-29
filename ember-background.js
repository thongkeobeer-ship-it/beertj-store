// ==================================================================
// ember-background.js — พื้นหลังสีดำ/เทาอ่อน + ประกายไฟ (เม็ดเล็กๆ) ลอยขึ้น
// สีทอง อ่อนบ้างเข้มบ้าง บางเม็ดลอยขึ้นแล้ว "แตก" กระจายเป็นสะเก็ดเล็กๆ
// ให้ความรู้สึกมีชีวิตชีวา คล้ายประกายไฟ/คบเพลิง
//
// วิธีใช้: ใส่ tag นี้ไว้ในหน้า HTML (ตำแหน่งไหนก็ได้ใน <body>):
//     <script src="ember-background.js"></script>
// สคริปต์จะสร้าง <canvas> เต็มจอเองอัตโนมัติ ไม่บังการคลิก/แตะ
// (pointer-events ปิดไว้) และไม่แย่งความสนใจจากเนื้อหาหลัก
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

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // ==== ค่าควบคุมภาพรวม (ปรับได้ตามใจ) ====
  const EMBER_COUNT = 55;        // จำนวนประกายไฟที่ลอยอยู่พร้อมกัน
  const BURST_CHANCE = 0.22;     // โอกาสที่เม็ดหนึ่งๆ จะแตกกระจายก่อนดับ
  const BURST_FRAGMENTS = [5, 11]; // จำนวนสะเก็ดที่เกิดขึ้นตอนแตก [min, max]

  // โทนทอง: อ่อนไปเข้ม
  const GOLD_SHADES = [
    '255,236,190', // ทองอ่อนเกือบขาว
    '255,214,140', // ทองอ่อน
    '255,186,90',  // ทองกลาง
    '250,160,55',  // ทองเข้ม
    '214,120,30',  // ทองเข้มอมน้ำตาล
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function easeInOut(t) { return t * t * (3 - 2 * t); }

  // ==== พื้นหลัง: ดำ + เทาอ่อนนวลๆ แบบไล่เฉด ====
  let bgGradient = null;
  function buildBackgroundGradient() {
    const g = ctx.createRadialGradient(
      width * 0.5, height * 0.62, 0,
      width * 0.5, height * 0.62, Math.max(width, height) * 0.75
    );
    g.addColorStop(0, '#1c1b1a');   // เทาเข้มอมดำ ตรงกลาง-ล่าง (ใกล้แหล่งไฟ)
    g.addColorStop(0.45, '#111110');
    g.addColorStop(1, '#000000');   // ดำสนิทที่ขอบ
    bgGradient = g;
  }
  buildBackgroundGradient();
  window.addEventListener('resize', buildBackgroundGradient);

  // ==== เม็ดประกายไฟหลัก ====
  function spawnEmber(startMidLife) {
    const maxLife = rand(4500, 9000);
    return {
      type: 'ember',
      x: rand(0, width),
      y: height + rand(10, 80),
      radius: rand(1.4, 3.6),
      color: pick(GOLD_SHADES),
      speedY: rand(0.018, 0.05),           // px/ms ลอยขึ้น
      driftAmp: rand(6, 26),
      driftFreq: rand(0.0008, 0.0022),
      driftPhase: rand(0, Math.PI * 2),
      flickerFreq: rand(0.003, 0.008),
      flickerPhase: rand(0, Math.PI * 2),
      life: startMidLife ? rand(0, maxLife) : 0,
      maxLife,
      fadeIn: rand(300, 700),
      fadeOut: rand(900, 1800),
      willBurst: Math.random() < BURST_CHANCE,
      burstAt: rand(0.45, 0.85),
      burst: false,
    };
  }

  // ==== สะเก็ดเล็กๆ ที่กระจายออกตอนเม็ดแตก ====
  function spawnFragment(x, y, color) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.03, 0.12);
    const maxLife = rand(500, 1100);
    return {
      type: 'fragment',
      x, y,
      radius: rand(0.6, 1.6),
      color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(0.01, 0.04), // เอนขึ้นเล็กน้อย
      life: 0,
      maxLife,
      fadeIn: 40,
      fadeOut: maxLife * 0.6,
    };
  }

  function triggerBurst(h) {
    const count = Math.round(rand(BURST_FRAGMENTS[0], BURST_FRAGMENTS[1]));
    for (let i = 0; i < count; i++) {
      particles.push(spawnFragment(h.x, h.y, h.color));
    }
  }

  const particles = [];
  for (let i = 0; i < EMBER_COUNT; i++) {
    particles.push(spawnEmber(true));
  }

  function opacityOf(p) {
    if (p.life < p.fadeIn) return easeInOut(p.life / p.fadeIn);
    const life = p.type === 'ember' ? p.maxLife : p.maxLife;
    if (p.life > life - p.fadeOut) {
      const t = (p.life - (life - p.fadeOut)) / p.fadeOut;
      return 1 - easeInOut(Math.max(0, Math.min(1, t)));
    }
    return 1;
  }

  function updateEmber(h, dt, i) {
    h.life += dt;
    h.y -= h.speedY * dt;
    h.x += Math.sin(h.life * h.driftFreq + h.driftPhase) * (h.driftAmp * 0.0018 * dt);

    // ถึงจุดที่ควรแตกกระจาย
    if (h.willBurst && !h.burst && h.life >= h.maxLife * h.burstAt) {
      h.burst = true;
      triggerBurst(h);
      h.maxLife = h.life + Math.min(h.fadeOut, 250); // ดับตัวเองไวๆ หลังแตก
    }

    if (h.life >= h.maxLife || h.y < -20) {
      particles[i] = spawnEmber(false);
      return;
    }

    const opacity = opacityOf(h);
    if (opacity <= 0.01) return;

    const flicker = 0.75 + 0.25 * Math.sin(h.life * h.flickerFreq + h.flickerPhase);
    const alpha = opacity * flicker;

    ctx.beginPath();
    ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${h.color},${alpha.toFixed(3)})`;
    ctx.shadowColor = `rgba(${h.color},${(alpha * 0.9).toFixed(3)})`;
    ctx.shadowBlur = h.radius * 4;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function updateFragment(f, dt, i) {
    f.life += dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += 0.00002 * dt; // แรงโน้มถ่วงเบาๆ ดึงกลับลงหลังพุ่งออก

    if (f.life >= f.maxLife) {
      particles[i] = spawnEmber(false); // แทนที่ด้วยเม็ดใหม่ เพื่อรักษาจำนวนรวม
      return;
    }

    const opacity = opacityOf(f);
    if (opacity <= 0.01) return;

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${f.color},${opacity.toFixed(3)})`;
    ctx.shadowColor = `rgba(${f.color},${(opacity * 0.8).toFixed(3)})`;
    ctx.shadowBlur = f.radius * 3;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  let lastTime = performance.now();
  let rafId = null;

  function drawFrame(time) {
    const dt = Math.min(time - lastTime, 50); // กันค่ากระโดดตอนสลับแท็บ
    lastTime = time;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (!prefersReducedMotion) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.type === 'ember') updateEmber(p, dt, i);
        else updateFragment(p, dt, i);
      }
      rafId = requestAnimationFrame(drawFrame);
    } else {
      // โหมดลดการเคลื่อนไหว: วาดเฟรมนิ่งเฟรมเดียว
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},0.7)`;
        ctx.fill();
      });
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
