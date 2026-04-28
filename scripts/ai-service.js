/* ============================================================
   BioLab — AI Service (Frontend)
   Communicates with backend AI proxy routes
   Provides: askTutor, analyzeData, gradeReport, getMentorFeedback
   Includes floating chat UI component
   ============================================================ */

const BioLabAI = (() => {

  const API_BASE = '/api/ai';
  let chatHistory = [];
  let chatOpen = false;
  let chatInitialized = false;

  // ── API Communication ──
  async function _post(endpoint, data) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('BioLab AI Error:', err);
      return { error: true, message: err.message };
    }
  }

  // ── AI Tutor (Socratic) ──
  async function askTutor(question, context = '') {
    const result = await _post('/tutor', {
      question,
      context,
      history: chatHistory.slice(-6) // Last 6 messages for context
    });
    if (!result.error) {
      chatHistory.push({ role: 'user', content: question });
      chatHistory.push({ role: 'assistant', content: result.reply });
      // Track interaction
      if (window.BioLabData) {
        const profile = BioLabData.Profile.get();
        profile._aiInteractions = (profile._aiInteractions || 0) + 1;
        BioLabData.Profile.save(profile);
        BioLabData.Analytics.track({ type: 'ai_chat', question: question.substring(0, 100) });
      }
    }
    return result;
  }

  // ── AI Scientist Mode ──
  async function analyzeData(experimentData, hypothesis = '') {
    return await _post('/analyze', {
      data: experimentData,
      hypothesis,
      type: 'experiment_analysis'
    });
  }

  // ── Auto-Grading ──
  async function gradeReport(report, rubric = 'default') {
    return await _post('/grade', {
      report,
      rubric
    });
  }

  // ── AI Mentor (Startup Lab) ──
  async function getMentorFeedback(projectIdea) {
    return await _post('/mentor', {
      idea: projectIdea
    });
  }

  // ── AI Quiz Generation ──
  async function generateQuiz(topic, difficulty = 'normal', count = 5) {
    return await _post('/quiz', {
      topic,
      difficulty,
      count
    });
  }

  // ══════════════════════════════════════════════
  //  FLOATING CHAT UI
  // ══════════════════════════════════════════════
  function initChatUI() {
    if (chatInitialized) return;
    chatInitialized = true;

    const chatHTML = `
      <div class="bv-chat-bubble" id="bvChatBubble" title="AI Tutor">
        <span class="bv-chat-bubble-icon">🤖</span>
        <span class="bv-chat-bubble-pulse"></span>
      </div>
      <div class="bv-chat-panel" id="bvChatPanel">
        <div class="bv-chat-header">
          <div class="bv-chat-header-info" style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
            <span class="bv-chat-avatar">🤖</span>
            <div>
            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0;">
              <div class="bv-chat-name" id="activeAgentName" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Gia sư AI</div>
              <select class="bv-chat-agent-select" id="agentSelect">
                <option value="tutor" selected>Gia sư AI</option>
                <option value="scientist">Nhà khoa học AI</option>
                <option value="mentor">Cố vấn khởi nghiệp</option>
              </select>
            </div>
          </div>
          <button class="bv-chat-close" id="bvChatClose">✕</button>
        </div>
        <div class="bv-chat-messages" id="bvChatMessages">
          <div class="bv-chat-msg bv-chat-msg-ai">
            <div class="bv-chat-msg-content">
              Xin chào! 👋 Tôi là Gia sư AI của BioLab. Tôi có thể giúp bạn:
              <br>• Giải thích khái niệm sinh học
              <br>• Phân tích dữ liệu thí nghiệm
              <br>• Hỏi ngược để bạn tư duy sâu hơn
              <br><br>Hãy hỏi tôi bất cứ điều gì! 🧬
            </div>
          </div>
        </div>
        <div class="bv-chat-input-wrap">
          <input type="text" class="bv-chat-input" id="bvChatInput"
            placeholder="Hỏi Gia sư AI..." autocomplete="off">
          <button class="bv-chat-send" id="bvChatSend">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    const chatContainer = document.createElement('div');
    chatContainer.id = 'bvChatContainer';
    chatContainer.className = 'bv-chat-container';
    chatContainer.innerHTML = chatHTML;
    document.body.appendChild(chatContainer);

    // Events
    const bubble = document.getElementById('bvChatBubble');
    const panel = document.getElementById('bvChatPanel');
    const closeBtn = document.getElementById('bvChatClose');
    const input = document.getElementById('bvChatInput');
    const sendBtn = document.getElementById('bvChatSend');

    const agentSelect = document.getElementById('agentSelect');
    const agentName = document.getElementById('activeAgentName');

    bubble.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));
    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    agentSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      const name = e.target.options[e.target.selectedIndex].text;
      agentName.textContent = name;
      console.log(`%c 🔄 Chuyển sang Chatbot: ${name} `, 'background:#7C4DFF; color:#fff; font-weight:bold;');
      
      // Clear history or context if needed?
      chatHistory = []; 
      const messages = document.getElementById('bvChatMessages');
      messages.innerHTML += `<div class="bv-chat-system">Đã chuyển sang ${name}</div>`;
    });
  }

  function toggleChat(force) {
    const panel = document.getElementById('bvChatPanel');
    const bubble = document.getElementById('bvChatBubble');
    chatOpen = force !== undefined ? force : !chatOpen;
    panel.classList.toggle('open', chatOpen);
    bubble.classList.toggle('hidden', chatOpen);
    if (chatOpen) {
      document.getElementById('bvChatInput').focus();
    }
  }

  async function sendMessage() {
    const input = document.getElementById('bvChatInput');
    const messages = document.getElementById('bvChatMessages');
    const question = input.value.trim();
    if (!question) return;

    // Add user message
    messages.innerHTML += `
      <div class="bv-chat-msg bv-chat-msg-user">
        <div class="bv-chat-msg-content">${escapeHtml(question)}</div>
      </div>
    `;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'bv-chat-msg bv-chat-msg-ai bv-chat-typing';
    typing.innerHTML = `
      <div class="bv-chat-msg-content">
        <span class="bv-typing-dot"></span>
        <span class="bv-typing-dot"></span>
        <span class="bv-typing-dot"></span>
      </div>
    `;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    // Get current page context
    const pageContext = document.title + ' | ' + (document.querySelector('h1')?.textContent || '');
    const agent = document.getElementById('agentSelect').value;

    console.log(`%c ✉️ Gửi câu hỏi đến [${agent}]: %c "${question}" `, 'color:#7C4DFF; font-weight:bold;', 'color:#fff; font-style:italic;');
    const startTime = performance.now();

    let result;
    if (agent === 'scientist') result = await analyzeData({ rawData: question }, '');
    else if (agent === 'mentor') result = await getMentorFeedback(question);
    else result = await askTutor(question, pageContext);

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`%c ⏱️ Thời gian xử lý: ${duration}s`, 'color:#FFD740;');

    typing.remove();

    if (!result.error) {
      const fullReply = result.reply || result.analysis || result.feedback || '';
      console.log(`%c ✨ [${agent}] Trả lời (Full Raw):`, 'color:#00D4AA; font-weight:bold;');
      console.log(fullReply);
    } else {
      console.error(`%c ❌ Lỗi từ [${agent}]:`, 'color:#FF5252; font-weight:bold;', result.message || 'Unknown error');
    }

    // Determine the reply to show
    let reply = '';
    if (result.error) {
      // If we have a reply from the server (e.g. Gemini error message), use it
      // Otherwise use the generic connection error
      reply = result.reply || result.analysis || result.feedback || '⚠️ Không thể kết nối AI. Vui lòng kiểm tra server backend.';
    } else {
      reply = result.reply || result.analysis || result.feedback || 'Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể hỏi lại không?';
    }

    messages.innerHTML += `
      <div class="bv-chat-msg bv-chat-msg-ai">
        <div class="bv-chat-msg-content">${formatAIResponse(reply)}</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    // XP for asking AI
    if (window.BioLabData && !result.error) {
      BioLabData.Profile.addXP(5, 'Hỏi AI Tutor');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatAIResponse(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  async function checkAgents() {
    console.log('%c 🤖 BIOLAB AI SYSTEM: Đang kiểm tra danh sách Chatbot... ', 'background:#1A1F3A; color:#FFD740; font-weight:bold; padding:4px; border-radius:4px;');
    
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      
      if (data.agents) {
        data.agents.forEach(agent => {
          const statusIcon = agent.status === 'ready' ? '✅' : '❌';
          const statusColor = agent.status === 'ready' ? '#00D4AA' : '#FF5252';
          console.log(
            `%c ${statusIcon} %c ${agent.name.padEnd(20)} %c [${agent.model}] %c Status: ${agent.status} `,
            'font-size:12px;',
            'color:#fff; font-weight:bold;',
            'color:#7C4DFF;',
            `color:${statusColor}; font-weight:bold;`
          );
        });
        
        const readyCount = data.agents.filter(a => a.status === 'ready').length;
        if (readyCount === 0) {
          console.warn('⚠️ CẢNH BÁO: Không có Chatbot nào sẵn sàng. Vui lòng kiểm tra GEMINI_API_KEY.');
        } else {
          console.log(`%c 🚀 ${readyCount}/${data.agents.length} Chatbot đã sẵn sàng hoạt động! `, 'color:#00D4AA; font-weight:bold;');
        }
      }
    } catch (err) {
      console.error('❌ Lỗi kết nối hệ thống AI:', err.message);
    }
  }

  // Auto-init chat and check agents
  document.addEventListener('DOMContentLoaded', () => {
    initChatUI();
    checkAgents();
  });

  // Add CSS for agent select
  const style = document.createElement('style');
  style.textContent = `
    .bv-chat-agent-select {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 4px;
      cursor: pointer;
      outline: none;
      margin-top: 2px;
      width: 100%;
    }
    .bv-chat-agent-select:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .bv-chat-system {
      font-size: 10px;
      color: var(--color-primary);
      text-align: center;
      margin: 10px 0;
      font-style: italic;
      opacity: 0.7;
    }
  `;
  document.head.appendChild(style);

  return {
    askTutor,
    analyzeData,
    gradeReport,
    getMentorFeedback,
    generateQuiz,
    toggleChat,
    initChatUI
  };
})();

if (typeof window !== 'undefined') {
  window.BioLabAI = BioLabAI;
}
