const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Gemini AI Setup ──
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// ── Gemini AI Models ──
// Available: gemini-3-flash-preview, gemini-3.1-pro-preview, gemini-2.5-flash, gemini-2.5-pro
const modelId = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const model = genAI.getGenerativeModel({ model: modelId });
const proModel = genAI.getGenerativeModel({ model: 'gemini-3.1-pro-preview' }); // For complex analysis

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'BioLab API',
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

    const systemPrompt = `Bạn là AI Tutor của BioLab — hệ sinh thái giáo dục sinh học số.

NGUYÊN TẮC DẠY HỌC:
- Dùng phương pháp Socratic: KHÔNG đưa đáp án trực tiếp
- Hỏi ngược để học sinh tự tư duy
- Gợi ý từng bước, từ dễ đến khó
- Phát hiện sai lầm và sửa nhẹ nhàng
- Khen ngợi khi học sinh đúng
- Sử dụng ví dụ thực tế từ đời sống
- Trả lời bằng tiếng Việt
- Ngắn gọn, dễ hiểu, phù hợp học sinh phổ thông

CONTEXT hiện tại: ${context || 'Trang chủ BioLab'}`;

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

    const prompt = `Bạn là AI Scientist của BioLab. Phân tích dữ liệu thí nghiệm sau và đưa ra nhận xét khoa học.

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

    const result = await proModel.generateContent(prompt);
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

    const result = await proModel.generateContent(prompt);
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

    const result = await proModel.generateContent(prompt);
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

// ── AI Auto Curriculum ──
app.post('/api/ai/curriculum', async (req, res) => {
  try {
    const { topic, grade, level } = req.body;
    const prompt = `Bạn là chuyên gia thiết kế chương trình Sinh học phổ thông Việt Nam.

Hãy thiết kế KẾ HOẠCH BÀI DẠY chi tiết cho chủ đề: "${topic}"
Khối lớp: ${grade || '10'}
Mức độ: ${level || 'normal'}

YÊU CẦU (theo chuẩn CT GDPT 2018):
1. MỤC TIÊU BÀI HỌC (theo 3 năng lực KHTN)
2. NỘI DUNG CHÍNH (kiến thức cốt lõi)
3. HOẠT ĐỘNG HỌC TẬP (4-5 hoạt động, mỗi hoạt động có thời gian, phương pháp)
4. THÍ NGHIỆM GỢI Ý (có thể làm trên BioLab)
5. CÂU HỎI ĐÁNH GIÁ (3 câu theo Bloom: NB, TH, VD)
6. HOMEWORK / DỰ ÁN MỞ RỘNG

Trả lời bằng tiếng Việt, format rõ ràng.`;

    const result = await model.generateContent(prompt);
    res.json({ lesson: result.response.text(), status: 'ok' });
  } catch (err) {
    console.error('AI Curriculum error:', err.message);
    res.json({ lesson: 'Không thể sinh bài học lúc này.', status: 'error' });
  }
});

// ── AI Scientist 2.0 (Full Report) ──
app.post('/api/ai/report', async (req, res) => {
  try {
    const { data, hypothesis, title } = req.body;
    const prompt = `Bạn là AI Scientist. Hãy viết BÁO CÁO KHOA HỌC HOÀN CHỈNH theo format IMRaD.

TIÊU ĐỀ: ${title || 'Báo cáo thí nghiệm'}
DỮ LIỆU: ${JSON.stringify(data)}
GIẢ THUYẾT: ${hypothesis || 'Chưa có'}

FORMAT BÁO CÁO:
1. TÓM TẮT (Abstract)
2. GIỚI THIỆU (Introduction) - bối cảnh, mục tiêu
3. PHƯƠNG PHÁP (Methods) - quy trình TN
4. KẾT QUẢ (Results) - phân tích dữ liệu
5. THẢO LUẬN (Discussion) - giải thích, so sánh
6. KẾT LUẬN (Conclusion)
7. ĐỀ XUẤT THÍ NGHIỆM TIẾP THEO

Viết bằng tiếng Việt, học thuật nhưng dễ hiểu cho HS phổ thông.`;

    const result = await model.generateContent(prompt);
    res.json({ report: result.response.text(), status: 'ok' });
  } catch (err) {
    res.json({ report: 'Lỗi tạo báo cáo.', status: 'error' });
  }
});

// ── Teacher In-Memory Store ──
const teacherStore = { classes: [], assignments: [] };

app.post('/api/teacher/class', (req, res) => {
  const { name, grade, school } = req.body;
  const cls = { id: 'cls_' + Date.now(), name, grade, school, createdAt: new Date().toISOString() };
  teacherStore.classes.push(cls);
  res.json({ class: cls, status: 'ok' });
});

app.get('/api/teacher/classes', (req, res) => {
  res.json({ classes: teacherStore.classes, status: 'ok' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🧬 BioLab X Server v3.0 running at http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🏫 Teacher Mode: http://localhost:${PORT}/teacher.html`);
  console.log(`🧠 Digital Twin: http://localhost:${PORT}/zones/profile/digital-twin.html`);
  console.log(`🤖 AI Layer: ${process.env.GEMINI_API_KEY ? '✅ Active (' + modelId + ')' : '⚠️ No API Key'}\n`);
});

module.exports = app;
