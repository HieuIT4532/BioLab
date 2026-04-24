/* ============================================================
   BioLab — Gamification UI
   XP bar, level display, badge toasts, achievement notifications
   ============================================================ */

const BioLabGamification = (() => {

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    injectUI();
    updateDisplay();
    bindEvents();
  }

  // ── Inject Gamification UI into page ──
  function injectUI() {
    // XP Bar (top of page, under navbar)
    const xpBar = document.createElement('div');
    xpBar.id = 'bioverse-xp-bar';
    xpBar.className = 'bv-xp-bar';
    xpBar.innerHTML = `
      <div class="bv-xp-info">
        <span class="bv-level-badge" id="bvLevelBadge">🔬 Lv.1</span>
        <span class="bv-level-title" id="bvLevelTitle">Nhà Khoa Học Tập Sự</span>
        <span class="bv-xp-text" id="bvXPText">0 / 100 XP</span>
      </div>
      <div class="bv-xp-track">
        <div class="bv-xp-fill" id="bvXPFill" style="width: 0%"></div>
      </div>
    `;
    document.body.prepend(xpBar);

    // Toast container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'bioverse-toasts';
    toastContainer.className = 'bv-toast-container';
    document.body.appendChild(toastContainer);

    // Level-up overlay
    const levelUp = document.createElement('div');
    levelUp.id = 'bioverse-levelup';
    levelUp.className = 'bv-levelup-overlay';
    levelUp.innerHTML = `
      <div class="bv-levelup-content">
        <div class="bv-levelup-particles"></div>
        <div class="bv-levelup-emoji" id="bvLevelUpEmoji">🎉</div>
        <h2>LEVEL UP!</h2>
        <div class="bv-levelup-level" id="bvLevelUpLevel">Level 2</div>
        <div class="bv-levelup-title" id="bvLevelUpTitle">Trợ Lý Nghiên Cứu</div>
        <button class="bv-levelup-btn" onclick="document.getElementById('bioverse-levelup').classList.remove('active')">
          Tuyệt vời! →
        </button>
      </div>
    `;
    document.body.appendChild(levelUp);
  }

  // ── Update XP Display ──
  function updateDisplay() {
    if (!window.BioLabData) return;
    const profile = BioLabData.Profile.get();
    const progress = BioLabData.Profile.getXPProgress();
    const levelInfo = BioLabData.Profile.getLevelTitle(profile.level);

    const badge = document.getElementById('bvLevelBadge');
    const title = document.getElementById('bvLevelTitle');
    const xpText = document.getElementById('bvXPText');
    const xpFill = document.getElementById('bvXPFill');

    if (badge) badge.textContent = `${levelInfo.emoji} Lv.${profile.level}`;
    if (title) title.textContent = levelInfo.title;
    if (xpText) xpText.textContent = `${progress.current} / ${progress.needed} XP`;
    if (xpFill) xpFill.style.width = `${progress.percent}%`;
  }

  // ── Show Toast ──
  function showToast(message, emoji = '✨', type = 'info', duration = 3000) {
    const container = document.getElementById('bioverse-toasts');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `bv-toast bv-toast-${type}`;
    toast.innerHTML = `
      <span class="bv-toast-emoji">${emoji}</span>
      <div class="bv-toast-body">
        <div class="bv-toast-message">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // ── Show XP Gain ──
  function showXPGain(amount, source) {
    showToast(`+${amount} XP — ${source}`, '⚡', 'xp', 2500);
    updateDisplay();
  }

  // ── Show Badge Earned ──
  function showBadge(badge) {
    showToast(`Huy hiệu mới: ${badge.name}`, badge.emoji, 'badge', 4000);
  }

  // ── Show Level Up ──
  function showLevelUp(level, title) {
    const overlay = document.getElementById('bioverse-levelup');
    const emoji = document.getElementById('bvLevelUpEmoji');
    const levelEl = document.getElementById('bvLevelUpLevel');
    const titleEl = document.getElementById('bvLevelUpTitle');

    const levelInfo = BioLabData.Profile.getLevelTitle(level);
    if (emoji) emoji.textContent = levelInfo.emoji;
    if (levelEl) levelEl.textContent = `Level ${level}`;
    if (titleEl) titleEl.textContent = levelInfo.title;

    if (overlay) overlay.classList.add('active');
    updateDisplay();
  }

  // ── Bind Events ──
  function bindEvents() {
    window.addEventListener('bioverse:xp', (e) => {
      showXPGain(e.detail.amount, e.detail.source);
      if (e.detail.leveledUp) {
        setTimeout(() => showLevelUp(e.detail.level), 1000);
      }
      // Check badges after XP gain
      setTimeout(() => {
        if (window.BioLabData) {
          const newBadges = BioLabData.Badges.check();
          newBadges.forEach((b, i) => {
            setTimeout(() => showBadge(b), i * 1500);
          });
        }
      }, 500);
    });

    window.addEventListener('bioverse:badge', (e) => {
      showBadge(e.detail);
    });

    window.addEventListener('bioverse:levelup', (e) => {
      showLevelUp(e.detail.level, e.detail.title);
    });
  }

  return { init, updateDisplay, showToast, showXPGain, showBadge, showLevelUp };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  BioLabGamification.init();
});
