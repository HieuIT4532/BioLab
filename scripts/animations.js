/* ============================================================
   BioLab — Scroll Animations
   IntersectionObserver reveals, counter, typewriter
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Scroll Reveal ──
  const reveals = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Don't unobserve — allow re-entering animations
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));

  // ── Counter Animation ──
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 2000;
    const start = performance.now();
    const suffix = el.dataset.suffix || (target > 10 ? '+' : '');

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  // ── Typewriter Effect ──
  const typewriterEl = document.getElementById('typewriter');
  if (typewriterEl) {
    const phrases = [
      'HỌC = TRẢI NGHIỆM + DỮ LIỆU + PHẢN HỒI THÔNG MINH',
      'Inquiry-Based Learning ∙ Project-Based Learning',
      'AI-Augmented Learning cho giáo dục phổ thông',
      '6 Phòng Lab Ảo ∙ 50+ Thí Nghiệm ∙ 1 AI Tutor',
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let pauseTimer = 0;

    function typewrite() {
      const current = phrases[phraseIdx];

      if (!isDeleting) {
        typewriterEl.textContent = current.substring(0, charIdx + 1);
        charIdx++;

        if (charIdx === current.length) {
          isDeleting = true;
          pauseTimer = 60; // pause at end
        }
      } else {
        if (pauseTimer > 0) {
          pauseTimer--;
          requestAnimationFrame(typewrite);
          return;
        }

        typewriterEl.textContent = current.substring(0, charIdx - 1);
        charIdx--;

        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          pauseTimer = 20; // pause before next phrase
        }
      }

      const speed = isDeleting ? 30 : 50;
      setTimeout(() => requestAnimationFrame(typewrite), speed);
    }

    // Start after a short delay
    setTimeout(typewrite, 1500);
  }

  // ── Parallax subtle on scroll ──
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const hero = document.querySelector('.hero-content');
        if (hero && scrollY < window.innerHeight) {
          hero.style.transform = `translateY(${scrollY * 0.15}px)`;
          hero.style.opacity = 1 - (scrollY / window.innerHeight) * 0.5;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
});
