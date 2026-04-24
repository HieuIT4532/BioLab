/* ============================================================
   BioVerse — Zone Card Interactions
   3D tilt on hover, glow follow cursor, click navigation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.zone-card');

  cards.forEach(card => {
    const inner = card.querySelector('.zone-card-inner');
    const glow = card.querySelector('.zone-card-glow');
    let bounds;

    function handleMouseEnter() {
      bounds = card.getBoundingClientRect();
    }

    function handleMouseMove(e) {
      if (!bounds) return;

      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;

      // 3D Tilt
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;

      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

      // Glow follow
      if (glow) {
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
      }
    }

    function handleMouseLeave() {
      inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      inner.style.transition = 'transform 0.5s ease-out';
      setTimeout(() => {
        inner.style.transition = '';
      }, 500);
    }

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
  });
});
