/* ============================================================
   BioLab — AI Scientist Mode
   🔥 "Chốt giải nhất" feature
   Student inputs experiment data → AI analyzes → suggests hypotheses
   → recommends next experiments
   ============================================================ */

const BioLabScientist = (() => {
  let panelOpen = false;
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    injectUI();
  }

  function injectUI() {
    const html = `
      <button class="bvs-fab" id="bvsToggle" title="AI Scientist Mode">
        <span>🔬</span>
      </button>
      <div class="bvs-panel" id="bvsPanel">
        <div class="bvs-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">🔬</span>
            <div>
              <div style="font-weight:700;color:var(--color-light);">AI Scientist Mode</div>
              <div style="font-size:0.65rem;color:var(--color-warning);">🔥 EXPERIMENTAL</div>
            </div>
          </div>
          <button class="bvs-close" id="bvsClose">✕</button>
        </div>

        <div class="bvs-body" id="bvsBody">
          <div class="bvs-step">
            <div class="bvs-step-label">📊 Bước 1: Nhập Dữ Liệu Thí Nghiệm</div>
            <textarea class="zone-textarea" id="bvsData" style="min-height:100px;font-size:0.8rem;"
              placeholder="Dán dữ liệu thí nghiệm vào đây...&#10;VD: pH 2: 0.5 mM/s, pH 4: 1.2, pH 7: 3.5, pH 10: 1.0"></textarea>
          </div>

          <div class="bvs-step">
            <div class="bvs-step-label">💡 Bước 2: Giả Thuyết (tùy chọn)</div>
            <input type="text" class="zone-input" id="bvsHypothesis" style="font-size:0.8rem;"
              placeholder="Giả thuyết của bạn...">
          </div>

          <div style="display:flex;gap:10px;width:100%;">
            <button class="zone-btn zone-btn-primary" id="bvsAnalyze" style="flex:1;">
              🤖 Phân Tích
            </button>
            <button class="zone-btn" id="bvsReport" style="flex:1;background:linear-gradient(135deg, #448AFF, #7C4DFF);color:#fff;border:none;">
              📄 Báo Cáo IMRaD
            </button>
          </div>

          <div id="bvsResult" style="display:none;">
            <div class="bvs-step-label" style="margin-top:16px;">🔬 Kết Quả Phân Tích</div>
            <div class="bvs-result-box" id="bvsResultContent"></div>
          </div>

          <div class="bvs-pipeline" style="margin-top:16px;">
            <div class="bvs-step-label">📋 Quy Trình AI Scientist</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px;">
              <span class="bvs-pipe-step" id="pipe1">📊 Dữ liệu</span>
              <span style="color:var(--color-text-dim);">→</span>
              <span class="bvs-pipe-step" id="pipe2">🔍 Phân tích</span>
              <span style="color:var(--color-text-dim);">→</span>
              <span class="bvs-pipe-step" id="pipe3">💡 Giả thuyết</span>
              <span style="color:var(--color-text-dim);">→</span>
              <span class="bvs-pipe-step" id="pipe4">🧪 TN tiếp</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Styles
    const style = document.createElement('style');
    style.textContent = `
      .bvs-fab {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, #FFD740, #FF6D00);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        box-shadow: 0 4px 20px rgba(255,215,64,0.3);
        transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
        z-index: 399;
      }
      .bvs-fab:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(255,215,64,0.4); }
      .bvs-fab.hidden { transform: scale(0); pointer-events: none; }

      .bvs-panel {
        position: fixed;
        bottom: 24px;
        right: 90px;
        width: 420px;
        max-height: 80vh;
        background: rgba(15,19,42,0.97);
        backdrop-filter: blur(30px);
        border: 1px solid rgba(255,215,64,0.2);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 16px 64px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,64,0.08);
        transform: scale(0.8) translateY(20px);
        opacity: 0;
        pointer-events: none;
        transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
        transform-origin: bottom right;
        z-index: 398;
      }
      .bvs-panel.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }

      .bvs-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        background: rgba(255,215,64,0.05);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .bvs-close {
        width: 28px; height: 28px; border-radius: 6px; border: none;
        background: rgba(255,255,255,0.06); color: var(--color-text-muted);
        cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;
      }
      .bvs-close:hover { background: rgba(255,82,82,0.2); color: #FF5252; }

      .bvs-body {
        padding: 16px;
        overflow-y: auto;
        flex: 1;
      }

      .bvs-step { margin-bottom: 12px; }
      .bvs-step-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-warning);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .bvs-result-box {
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 10px;
        padding: 14px;
        font-size: 0.8rem;
        color: var(--color-text);
        line-height: 1.6;
        max-height: 300px;
        overflow-y: auto;
      }

      .bvs-pipe-step {
        font-size: 0.65rem;
        padding: 4px 8px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 6px;
        color: var(--color-text-dim);
        transition: all 0.3s;
      }
      .bvs-pipe-step.active {
        background: rgba(255,215,64,0.15);
        border-color: rgba(255,215,64,0.3);
        color: var(--color-warning);
      }
      .bvs-pipe-step.done {
        background: rgba(0,212,170,0.1);
        border-color: rgba(0,212,170,0.3);
        color: var(--color-primary);
      }

      @media (max-width: 480px) {
        .bvs-panel { width: calc(100vw - 20px); right: 10px; bottom: 80px; }
      }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // Events
    document.getElementById('bvsToggle').addEventListener('click', () => togglePanel());
    document.getElementById('bvsClose').addEventListener('click', () => togglePanel(false));
    document.getElementById('bvsAnalyze').addEventListener('click', () => analyze());
    document.getElementById('bvsReport').addEventListener('click', () => generateReport());
  }

  function togglePanel(force) {
    panelOpen = force !== undefined ? force : !panelOpen;
    document.getElementById('bvsPanel').classList.toggle('open', panelOpen);
    document.getElementById('bvsToggle').classList.toggle('hidden', panelOpen);
  }

  async function analyze() {
    const data = document.getElementById('bvsData').value.trim();
    if (!data) { alert('Vui lòng nhập dữ liệu thí nghiệm!'); return; }

    const hypothesis = document.getElementById('bvsHypothesis').value.trim();
    const resultDiv = document.getElementById('bvsResult');
    const resultContent = document.getElementById('bvsResultContent');

    resultDiv.style.display = 'block';
    resultContent.innerHTML = '<div style="text-align:center;color:var(--color-warning);">🤖 AI đang phân tích...</div>';

    // Animate pipeline
    setPipelineStep(1);
    await delay(500);
    setPipelineStep(2);

    const result = await BioLabAI.analyzeData({ rawData: data }, hypothesis);
    setPipelineStep(3);
    await delay(300);
    setPipelineStep(4);

    const reply = result.error
      ? '⚠️ Không thể kết nối AI. Vui lòng khởi động server backend.'
      : (result.analysis || result.reply || 'Không có kết quả.');

    resultContent.innerHTML = reply
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    if (window.BioLabData) {
      BioLabData.Profile.addXP(25, 'AI Scientist Mode');
      BioLabData.Profile.updateCompetency('scientificThinking', 70);
      BioLabData.Analytics.track({ type: 'ai_scientist', dataLength: data.length });
    }
    if (window.BioLabTwin) {
      BioLabTwin.trackAction('ai_analyze', 'scientist_mode');
    }
  }

  async function generateReport() {
    const data = document.getElementById('bvsData').value.trim();
    if (!data) { alert('Vui lòng nhập dữ liệu thí nghiệm!'); return; }
    const hypothesis = document.getElementById('bvsHypothesis').value.trim();
    const resultDiv = document.getElementById('bvsResult');
    const resultContent = document.getElementById('bvsResultContent');

    resultDiv.style.display = 'block';
    resultContent.innerHTML = '<div style="text-align:center;color:var(--color-network);">🤖 AI đang viết Báo Cáo Khoa Học (IMRaD)...</div>';

    setPipelineStep(1); await delay(500); setPipelineStep(2);

    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, hypothesis, title: 'Báo cáo AI' })
      });
      const result = await res.json();
      
      setPipelineStep(3); await delay(300); setPipelineStep(4);
      
      const reply = result.report || 'Lỗi tạo báo cáo.';
      resultContent.innerHTML = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      if (window.BioLabTwin) BioLabTwin.trackAction('write_report', 'scientist_mode');
      if (window.BioLabStandards) BioLabStandards.recordActivity('report_written', 80);
    } catch(err) {
      resultContent.innerHTML = '⚠️ Lỗi kết nối API.';
    }
  }

  function setPipelineStep(step) {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`pipe${i}`);
      el.classList.remove('active', 'done');
      if (i < step) el.classList.add('done');
      if (i === step) el.classList.add('active');
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.addEventListener('DOMContentLoaded', () => init());

  return { init, togglePanel };
})();

if (typeof window !== 'undefined') {
  window.BioLabScientist = BioLabScientist;
}
