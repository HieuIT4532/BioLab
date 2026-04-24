/* ============================================================
   BioLab — DNA Particle Background Engine
   Canvas-based floating nucleotide particles with helix connections
   ============================================================ */

(function () {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animationId;

  const CONFIG = {
    particleCount: 120,
    maxSpeed: 0.3,
    connectionDistance: 150,
    mouseRadius: 200,
    mouseForce: 0.02,
    colors: [
      'rgba(0, 212, 170, ',   // emerald
      'rgba(0, 188, 212, ',   // cyan
      'rgba(124, 77, 255, ',  // purple
      'rgba(224, 64, 251, ',  // pink
      'rgba(64, 196, 255, ',  // blue
    ],
    baseSizes: [1.5, 2, 2.5, 3, 3.5],
  };

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
      this.vy = (Math.random() - 0.5) * CONFIG.maxSpeed;
      this.colorIdx = Math.floor(Math.random() * CONFIG.colors.length);
      this.baseSize = CONFIG.baseSizes[Math.floor(Math.random() * CONFIG.baseSizes.length)];
      this.size = this.baseSize;
      this.alpha = Math.random() * 0.5 + 0.3;
      this.pulseSpeed = Math.random() * 0.02 + 0.01;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(time) {
      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius && dist > 0) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * CONFIG.mouseForce;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // Damping
      this.vx *= 0.999;
      this.vy *= 0.999;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;

      // Pulse
      this.size = this.baseSize + Math.sin(time * this.pulseSpeed + this.pulsePhase) * 0.8;
    }

    draw() {
      const color = CONFIG.colors[this.colorIdx];
      
      // Glow
      ctx.beginPath();
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
      grad.addColorStop(0, color + (this.alpha * 0.5) + ')');
      grad.addColorStop(1, color + '0)');
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = color + this.alpha + ')';
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 8000));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDistance) {
          const alpha = (1 - dist / CONFIG.connectionDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 170, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate(time) {
    ctx.clearRect(0, 0, width, height);

    drawConnections();

    for (const p of particles) {
      p.update(time);
      p.draw();
    }

    animationId = requestAnimationFrame(animate);
  }

  // Events
  window.addEventListener('resize', () => {
    resize();
    // Reinitialize if particle count needs adjustment
    const targetCount = Math.min(CONFIG.particleCount, Math.floor((width * height) / 8000));
    while (particles.length < targetCount) particles.push(new Particle());
    while (particles.length > targetCount) particles.pop();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Start
  init();
  animate(0);
})();
