/* ============================================================
   BioLab — Main Script
   Navigation, mobile menu, smooth scroll, page orchestration
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar Scroll Behavior ──
  const navbar = document.getElementById('navbar');
  const scrollThreshold = 80;

  function updateNavbar() {
    if (window.scrollY > scrollThreshold) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // ── Mobile Menu ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // ── Active Nav Link ──
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.navbar-links a[href^="#"]');

  function setActiveNav() {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navAnchors.forEach(a => {
          a.classList.remove('active');
          if (a.getAttribute('href') === '#' + id) {
            a.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });

  // ── Smooth Scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.offsetTop - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Page Load Animation ──
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  // ── Console Branding ──
  console.log(
    '%c 🧬 BioLab %c Hệ Sinh Thái Phòng Thí Nghiệm Sinh Học Số ',
    'background: linear-gradient(135deg, #00D4AA, #7C4DFF); color: #0A0E27; font-weight: bold; padding: 8px 12px; border-radius: 6px 0 0 6px; font-size: 14px;',
    'background: #1A1F3A; color: #00D4AA; padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 14px;'
  );
});
