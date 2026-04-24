/* ============================================================
   BioVerse — AI Service (Frontend)
   Communicates with backend AI proxy routes
   Provides: askTutor, analyzeData, gradeReport, getMentorFeedback
   Includes floating chat UI component
   ============================================================ */

const BioVerseAI = (() => {

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
      console.error('BioVerse AI Error:', err);
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
      if (window.BioVerseData) {
        const profile = BioVerseData.Profile.get();
        profile._aiInteractions = (profile._aiInteractions || 0) + 1;
        BioVerseData.Profile.save(profile);
        BioVerseData.Analytics.track({ type: 'ai_chat', question: question.substring(0, 100) });
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
          <div class="bv-chat-header-info">
            <span class="bv-chat-avatar">🤖</span>
            <div>
              <div class="bv-chat-name">AI Tutor</div>
              <div class="bv-chat-status">BioVerse Assistant</div>
            </div>
          </div>
          <button class="bv-chat-close" id="bvChatClose">✕</button>
        </div>
        <div class="bv-chat-messages" id="bvChatMessages">
          <div class="bv-chat-msg bv-chat-msg-ai">
            <div class="bv-chat-msg-content">
              Xin chào! 👋 Tôi là AI Tutor của BioVerse. Tôi có thể giúp bạn:
              <br>• Giải thích khái niệm sinh học
              <br>• Phân tích dữ liệu thí nghiệm
              <br>• Hỏi ngược để bạn tư duy sâu hơn
              <br><br>Hãy hỏi tôi bất cứ điều gì! 🧬
            </div>
          </div>
        </div>
        <div class="bv-chat-input-wrap">
          <input type="text" class="bv-chat-input" id="bvChatInput"
            placeholder="Hỏi AI Tutor..." autocomplete="off">
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

    bubble.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));
    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
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

    const result = await askTutor(question, pageContext);
    typing.remove();

    const reply = result.error
      ? '⚠️ Không thể kết nối AI. Vui lòng kiểm tra server backend.'
      : (result.reply || 'Xin lỗi, tôi chưa hiểu câu hỏi. Bạn có thể hỏi lại không?');

    messages.innerHTML += `
      <div class="bv-chat-msg bv-chat-msg-ai">
        <div class="bv-chat-msg-content">${formatAIResponse(reply)}</div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;

    // XP for asking AI
    if (window.BioVerseData && !result.error) {
      BioVerseData.Profile.addXP(5, 'Hỏi AI Tutor');
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

  // Auto-init chat
  document.addEventListener('DOMContentLoaded', () => {
    initChatUI();
  });

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
  window.BioVerseAI = BioVerseAI;
}
