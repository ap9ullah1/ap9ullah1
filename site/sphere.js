// Interactive particle sphere for the hero section (vanilla canvas, no deps).
(function () {
  const canvas = document.getElementById("sphere");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COUNT = 900;
  const points = [];
  // Fibonacci sphere distribution for even spacing.
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }

  let width = 0, height = 0, dpr = 1, radius = 0;
  let rotX = 0.3, rotY = 0;
  let velX = 0, velY = 0.0025;
  let targetTiltX = 0, targetTiltY = 0, tiltX = 0, tiltY = 0;
  let mouse = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.min(width, height) * 0.4;
  }

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    mouse = { x: mx, y: my };
    targetTiltY = ((mx / width) - 0.5) * 0.8;
    targetTiltX = ((my / height) - 0.5) * 0.8;
  });
  canvas.addEventListener("pointerleave", () => {
    mouse = null;
    targetTiltX = targetTiltY = 0;
  });

  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", () => (dragging = false));
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.0008;
    velX = (e.clientY - lastY) * 0.0008;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  function frame() {
    rotY += velY;
    rotX += velX;
    if (!dragging) {
      velY += (0.0025 - velY) * 0.02;
      velX *= 0.95;
    }
    tiltX += (targetTiltX - tiltX) * 0.05;
    tiltY += (targetTiltY - tiltY) * 0.05;

    const ax = rotX + tiltX, ay = rotY + tiltY;
    const cosX = Math.cos(ax), sinX = Math.sin(ax);
    const cosY = Math.cos(ay), sinY = Math.sin(ay);
    const cx = width / 2, cy = height / 2;
    const fov = 3;

    ctx.clearRect(0, 0, width, height);
    const projected = [];
    for (const p of points) {
      let x = p.x * cosY - p.z * sinY;
      let z = p.x * sinY + p.z * cosY;
      let y = p.y * cosX - z * sinX;
      z = p.y * sinX + z * cosX;
      const scale = fov / (fov + z);
      let sx = cx + x * radius * scale;
      let sy = cy + y * radius * scale;
      // Push particles away from the cursor for an interactive ripple.
      if (mouse) {
        const dx = sx - mouse.x, dy = sy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 90 && dist > 0.01) {
          const f = (1 - dist / 90) * 18;
          sx += (dx / dist) * f;
          sy += (dy / dist) * f;
        }
      }
      projected.push({ sx, sy, z, scale });
    }
    projected.sort((a, b) => b.z - a.z);
    for (const p of projected) {
      const depth = (1 - p.z) / 2; // 0 back .. 1 front
      const alpha = 0.15 + depth * 0.85;
      const size = 0.6 + depth * 1.6;
      ctx.fillStyle = `rgba(${Math.round(88 + depth * 60)}, ${Math.round(166 + depth * 40)}, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, size * p.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  resize();
  frame();
})();
