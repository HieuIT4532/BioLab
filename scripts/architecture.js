/* ============================================================
   BioVerse — Architecture Section Interactive JS
   Expandable layers, live status, data flow animation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Toggle Layer Details ──
  document.querySelectorAll('.arch-layer-interactive').forEach(layer => {
    layer.addEventListener('click', () => {
      const wasExpanded = layer.classList.contains('expanded');
      // Close all
      document.querySelectorAll('.arch-layer-interactive').forEach(l => l.classList.remove('expanded'));
      // Toggle clicked
      if (!wasExpanded) layer.classList.add('expanded');
    });
  });

  // ── Live Status Ping ──
  async function checkHealth() {
    const statusEl = document.getElementById('archApiStatus');
    const dotEl = document.querySelector('.arch-live-dot');
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (statusEl) {
        statusEl.textContent = data.status === 'ok' ? 'Online' : 'Offline';
        statusEl.style.color = data.status === 'ok' ? 'var(--color-success)' : 'var(--color-error)';
      }
      // Update layer statuses
      if (data.layers) {
        document.querySelectorAll('[data-layer-status]').forEach(el => {
          const layer = el.dataset.layerStatus;
          const status = data.layers[layer];
          el.textContent = status === 'active' ? '● Active' : '⚠ ' + (status || 'unknown');
          el.className = 'arch-layer-status' + (status === 'active' ? '' : ' warning');
        });
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Offline';
        statusEl.style.color = 'var(--color-error)';
      }
    }
  }

  // Check on load if architecture section exists
  if (document.getElementById('architecture')) {
    checkHealth();
    setInterval(checkHealth, 30000); // Every 30s
  }

  // ── Update live stats ──
  function updateLiveStats() {
    if (!window.BioVerseData) return;
    const stats = BioVerseData.Analytics.getStats();
    const profile = stats.profile;

    const experimentCount = document.getElementById('archExpCount');
    const moduleCount = document.getElementById('archModuleCount');
    const aiCount = document.getElementById('archAICount');

    if (experimentCount) experimentCount.textContent = profile.experimentCount || 0;
    if (moduleCount) moduleCount.textContent = stats.modulesVisited || 0;
    if (aiCount) aiCount.textContent = profile._aiInteractions || 0;
  }

  if (document.getElementById('architecture')) {
    updateLiveStats();
  }
});
