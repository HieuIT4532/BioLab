const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Gemini AI Setup ──
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'BioVerse API',
    version: '2.0.0',
    layers: {
      presentation: 'active',
      simulation: 'active',
      ai: process.env.GEMINI_API_KEY ? 'active' : 'no_key',
      data: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// ══════════════════════════════════════════════
//  AI ROUTES
// ══════════════════════════════════════════════

// ── AI Tutor (Socratic) ──
app.post('/api/ai/tutor', async (req, res) => {
  try {
    const { question, context, history } = req.body;

    const systemPrompt = `Bạn là AI Tutor của BioVerse — hệ sinh thái giáo dục sinh học số.

NGUYÊN TẮC DẠY HỌC:
- Dùng phương pháp Socratic: KHÔNG đưa đáp án trực tiếp
- Hỏi ngược để học sinh tự tư duy
- Gợi ý từng bước, từ dễ đến khó
- Phát hiện sai lầm và sửa nhẹ nhàng
- Khen ngợi khi học sinh đúng
- Sử dụng ví dụ thực tế từ đời sống
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu, phù hợp học sinh phổ thông

CONTEXT hiện tại: ${context || 'Trang chủ BioVerse'}`;

    const chatHistory = (history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemPrompt
    });

    const result = await chat.sendMessage(question);
    const reply = result.response.text();

    res.json({ reply, status: 'ok' });
  } catch (err) {
    console.error('AI Tutor error:', err.message);
    res.json({
      reply: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Hãy thử lại sau nhé! 🔧',
      status: 'error',
      error: err.message
    });
  }
});

// ── AI Scientist Mode (Analyze Data) ──
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { data, hypothesis, type } = req.body;

    const prompt = `Bạn là AI Scientist của BioVerse. Phân tích dữ liệu thí nghiệm sau và đưa ra nhận xét khoa học.

DỮ LIỆU THÍ NGHIỆM:
${JSON.stringify(data, null, 2)}

${hypothesis ? 'GIẢ THUYẾT CỦA HỌC SINH: ' + hypothesis : ''}

YÊU CẦU:
1. Phân tích xu hướng dữ liệu
2. Đánh giá giả thuyết (nếu có)
3. Đề xuất giả thuyết mới
4. Gợi ý thí nghiệm tiếp theo
5. Chỉ ra sai số/bất thường

Trả lời bằng tiếng Việt, ngắn gọn, khoa học.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({
      analysis: reply,
      status: 'ok'
    });
  } catch (err) {
    console.error('AI Analyze error:', err.message);
    res.json({
      analysis: 'Không thể phân tích dữ liệu lúc này. Vui lòng thử lại.',
      status: 'error'
    });
  }
});

// ── Auto-Grading ──
app.post('/api/ai/grade', async (req, res) => {
  try {
    const { report, rubric } = req.body;

    const prompt = `Bạn là giáo viên sinh học chấm bài. Chấm báo cáo thí nghiệm sau theo rubric chuẩn.

BÁO CÁO:
${report}

RUBRIC ĐÁNH GIÁ:
1. Nhận thức sinh học (0-25): Hiểu đúng khái niệm, thuật ngữ
2. Thực hành thí nghiệm (0-25): Mô tả quy trình, biến số
3. Tư duy khoa học (0-25): Phân tích, suy luận, kết luận
4. Giải quyết vấn đề (0-25): Đề xuất giải pháp, sáng tạo

Trả lời theo format JSON:
{
  "scores": {"knowledge": X, "experiment": X, "thinking": X, "problemSolving": X},
  "total": X,
  "feedback": "...",
  "strengths": ["..."],
  "improvements": ["..."]
}`;

    const result = await model.generateContent(prompt);
    let reply = result.response.text();
    
    // Try to parse JSON from response
    try {
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ grading: parsed, status: 'ok' });
        return;
      }
    } catch (e) { /* fall through */ }

    res.json({ grading: { feedback: reply, total: 0 }, status: 'ok' });
  } catch (err) {
    console.error('AI Grade error:', err.message);
    res.json({ grading: { feedback: 'Lỗi chấm bài', total: 0 }, status: 'error' });
  }
});

// ── AI Mentor (Startup Lab) ──
app.post('/api/ai/mentor', async (req, res) => {
  try {
    const { idea } = req.body;

    const prompt = `Bạn là AI Mentor chuyên tư vấn dự án STEM sinh học cho học sinh phổ thông.

Ý TƯỞNG DỰ ÁN:
${idea}

HÃY:
1. Đánh giá tính khả thi (1-10)
2. Phân tích điểm mạnh
3. Chỉ ra thách thức
4. Đặt 3 câu hỏi phản biện (Socratic)
5. Gợi ý cải tiến
6. So sánh với dự án tương tự trên thế giới

Trả lời bằng tiếng Việt, phong cách mentor thân thiện nhưng chuyên nghiệp.`;

    const result = await model.generateContent(prompt);
    res.json({ feedback: result.response.text(), status: 'ok' });
  } catch (err) {
    console.error('AI Mentor error:', err.message);
    res.json({ feedback: 'Mentor đang bận. Hãy thử lại sau!', status: 'error' });
  }
});

// ── AI Quiz Generator ──
app.post('/api/ai/quiz', async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;

    const prompt = `Tạo ${count || 5} câu hỏi trắc nghiệm sinh học về chủ đề: "${topic}"
Độ khó: ${difficulty || 'normal'}

Trả lời theo format JSON array:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correct": 0,
    "explanation": "..."
  }
]

Lưu ý: correct là index (0-3) của đáp án đúng.
Câu hỏi phải phù hợp chương trình sinh học phổ thông Việt Nam.`;

    const result = await model.generateContent(prompt);
    let reply = result.response.text();

    try {
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.json({ questions: parsed, status: 'ok' });
        return;
      }
    } catch (e) { /* fall through */ }

    res.json({ questions: [], raw: reply, status: 'ok' });
  } catch (err) {
    console.error('AI Quiz error:', err.message);
    res.json({ questions: [], status: 'error' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🧬 BioVerse Server v2.0 running at http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Layer: ${process.env.GEMINI_API_KEY ? '✅ Active' : '⚠️ No API Key'}\n`);
});
