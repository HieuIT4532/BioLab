// ============ NAVIGATION ============
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Scroll handler for transparent navbar
  if (navbar && !navbar.classList.contains('navbar-solid')) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // Mobile menu toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // Generate DNA helix dots
  const dna = document.getElementById('heroDna');
  if (dna) {
    for (let i = 0; i < 20; i++) {
      const dot = document.createElement('div');
      dot.className = 'dna-dot';
      dot.style.top = `${i * 5}%`;
      dot.style.animationDelay = `${i * 0.15}s`;
      if (i % 2 === 0) {
        dot.style.left = `${10 + Math.sin(i * 0.6) * 20}px`;
      } else {
        dot.style.right = `${10 + Math.sin(i * 0.6) * 20}px`;
      }
      dna.appendChild(dot);

      if (i % 3 === 0) {
        const line = document.createElement('div');
        line.className = 'dna-line';
        line.style.top = `${i * 5}%`;
        dna.appendChild(line);
      }
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
