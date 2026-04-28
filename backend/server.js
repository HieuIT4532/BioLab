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
const flashModel = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    name: 'BioLab AI Gateway',
    agents: [
      { id: 'tutor', name: 'Gia sư AI', model: 'gemini-3-flash-preview', status: hasKey ? 'ready' : 'missing_key' },
      { id: 'scientist', name: 'Nhà khoa học AI', model: 'gemini-3-flash-preview', status: hasKey ? 'ready' : 'missing_key' },
      { id: 'mentor', name: 'Cố vấn khởi nghiệp', model: 'gemini-3-flash-preview', status: hasKey ? 'ready' : 'missing_key' }
    ],
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

    const systemPrompt = `Bạn là Gia sư AI của BioLab — hệ sinh thái giáo dục sinh học số.
NGUYÊN TẮC DẠY HỌC:
- Dùng phương pháp Socratic: KHÔNG đưa đáp án trực tiếp.
- Hỏi ngược để học sinh tự tư duy.
- Gợi ý từng bước, từ dễ đến khó.
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
CONTEXT hiện tại: ${context || 'Trang chủ BioLab'}`;

    // Initialize model with system instruction
    const tutorModel = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemPrompt
    });

    const chatHistory = (history || []).map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const chat = tutorModel.startChat({
      history: chatHistory
    });

    const result = await chat.sendMessage(question);
    const reply = result.response.text();

    res.json({ reply, status: 'ok' });
  } catch (err) {
    console.error('AI Tutor error:', err.message);
    res.json({
      reply: 'Xin lỗi, tôi đang gặp sự cố kết nối với bộ não AI. Hãy thử lại sau nhé! 🧠🔧',
      status: 'error',
      error: err.message
    });
  }
});

// ── AI Scientist Mode (Analyze Data) ──
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { data, hypothesis, type } = req.body;

    const scientistModel = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: 'Bạn là Nhà khoa học AI (Scientist) của BioLab. Nhiệm vụ của bạn là phân tích dữ liệu thí nghiệm, đánh giá giả thuyết và đề xuất hướng nghiên cứu tiếp theo.'
    });

    const prompt = `DỮ LIỆU THÍ NGHIỆM:
${JSON.stringify(data, null, 2)}

${hypothesis ? 'GIẢ THUYẾT CỦA HỌC SINH: ' + hypothesis : ''}

YÊU CẦU:
1. Phân tích xu hướng dữ liệu & nhận xét khoa học
2. Đánh giá giả thuyết
3. Đề xuất thí nghiệm tiếp theo hoặc cải tiến.`;

    const result = await scientistModel.generateContent(prompt);
    const reply = result.response.text();

    res.json({
      analysis: reply,
      status: 'ok'
    });
  } catch (err) {
    console.error('AI Analyze Error:', err.message);
    res.json({
      analysis: `⚠️ Không thể phân tích dữ liệu lúc này (${err.message}).`,
      status: 'error'
    });
  }
});

// ── Auto-Grading ──
app.post('/api/ai/grade', async (req, res) => {
  try {
    const { report, rubric } = req.body;

    const gradingModel = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: 'Bạn là chuyên gia giáo dục Sinh học. Nhiệm vụ của bạn là chấm điểm báo cáo thí nghiệm của học sinh dựa trên rubric và đưa ra nhận xét xây dựng.'
    });

    const prompt = `BÁO CÁO THÍ NGHIỆM:
${report}

RUBRIC ĐÁNH GIÁ (Thang điểm 100):
1. Nhận thức sinh học (25đ)
2. Thực hành thí nghiệm (25đ)
3. Tư duy khoa học (25đ)
4. Giải quyết vấn đề (25đ)

Trả lời theo format JSON:
{
  "scores": {"knowledge": X, "experiment": X, "thinking": X, "problemSolving": X},
  "total": X,
  "feedback": "...",
  "strengths": ["..."],
  "improvements": ["..."]
}`;

    const result = await gradingModel.generateContent(prompt);
    let reply = result.response.text();
    
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
    console.error('AI Grade Error:', err.message);
    res.json({ grading: { feedback: `⚠️ Lỗi chấm bài (${err.message})`, total: 0 }, status: 'error' });
  }
});

// ── AI Mentor (Startup Lab) ──
app.post('/api/ai/mentor', async (req, res) => {
  try {
    const { idea } = req.body;

    const mentorModel = genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview',
      systemInstruction: 'Bạn là một Hội đồng Giám khảo Khởi nghiệp Cấp cao và Mentor Chuyên sâu. Nhiệm vụ của bạn là đánh giá các dự án được cung cấp một cách khắt khe, thực tế và đa chiều.'
    });

    const prompt = `Với dự án sau đây, hãy thực hiện đánh giá chuyên sâu:
DỰ ÁN: ${idea}

HÃY CẤU TRÚC CÂU TRẢ LỜI THEO ĐÚNG 4 PHẦN SAU:

Phần 1: Phân tách Mentor theo Persona (Góc nhìn đa chiều)
Cung cấp góc nhìn, nhận xét và đặt ra các câu hỏi phản biện sắc bén dưới vai trò của 3 giám khảo:
- 👨🔬 The Scientist (Kỹ thuật/Khoa học)
- 💼 The Shark (Kinh doanh/Dòng tiền)
- 🌍 The Impact Investor (Bền vững/ESG)

Phần 2: Concept Khởi nghiệp Thực tế
Phân tích dự án dựa trên 2 framework kinh doanh:
- Quy mô thị trường (TAM/SAM/SOM): Tự đưa ra các giả định hợp lý để ước tính sơ bộ.
- Lợi thế độc quyền (Unfair Advantage/Moat): Chỉ ra điểm yếu chí mạng và rào cản gia nhập.

Phần 3: Lộ trình Hành động (Actionable Roadmap)
Xây dựng lộ trình 30-60-90 ngày cụ thể:
- 30 ngày: Trọng tâm R&D/Prototype.
- 60 ngày: Thử nghiệm thực tế (Beta test).
- 90 ngày: Tối ưu giá thành & mở bán/ra mắt.

Phần 4: Chấm điểm Dự án (Chỉ xuất JSON)
Đánh giá theo thang điểm 10 cho 5 tiêu chí. Trả về định dạng JSON thô (không kèm markdown):
{
  "radar_metrics": {
    "innovation": { "score": 0, "reason": "..." },
    "market_fit": { "score": 0, "reason": "..." },
    "technical_feasibility": { "score": 0, "reason": "..." },
    "environmental_impact": { "score": 0, "reason": "..." },
    "unfair_advantage": { "score": 0, "reason": "..." }
  }
}`;

    const result = await mentorModel.generateContent(prompt);
    res.json({ feedback: result.response.text(), status: 'ok' });
  } catch (err) {
    console.error('AI Mentor Error:', err.message);
    res.json({ 
      feedback: `⚠️ Mentor đang gặp sự cố kết nối AI (${err.message}). Vui lòng thử lại sau!`, 
      status: 'error' 
    });
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
