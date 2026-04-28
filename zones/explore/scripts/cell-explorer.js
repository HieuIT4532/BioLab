/* 
   BioLab — Cell Explorer (Interactive Tabs)
   Switches between high-quality Sketchfab 3D models.
*/

(function() {
  const CELL_MODELS = {
    animal: 'https://sketchfab.com/models/b7d84e5f2d5e411fbb195ab2742f2256/embed',
    plant: 'https://sketchfab.com/models/4be653ec2e904a368ac84b6df0677e3d/embed',
    bacteria: 'https://sketchfab.com/models/42439edc90cd4d87b8ae322a4dcee8de/embed'
  };

  const iframe = document.getElementById('cellIframe');
  const container = document.getElementById('modelContainer');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const buttons = document.querySelectorAll('.cell-tab-btn');
  const loading = document.getElementById('loadingOverlay');

  if (!iframe || buttons.length === 0) return;

  // Tab switching
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cellType = btn.dataset.cell;
      if (!CELL_MODELS[cellType] || btn.classList.contains('active')) return;

      // Update UI
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show loading with fade
      loading.style.display = 'flex';
      loading.style.opacity = '1';

      // Update iframe
      iframe.src = CELL_MODELS[cellType];

      // Hide loading when iframe loads
      iframe.onload = () => {
        setTimeout(() => {
          loading.style.opacity = '0';
          setTimeout(() => { loading.style.display = 'none'; }, 300);
        }, 800);
      };
    });
  });

  // Fullscreen toggle
  btnFullscreen?.addEventListener('click', () => {
    container.classList.toggle('fullscreen');
    btnFullscreen.textContent = container.classList.contains('fullscreen') ? '✕' : '⛶';
  });

  // ESC to exit fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && container.classList.contains('fullscreen')) {
      container.classList.remove('fullscreen');
      btnFullscreen.textContent = '⛶';
    }
  });
})();
