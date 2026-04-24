/* ============================================================
   BioLab — Story Engine
   Immune Cell vs Virus — 5-chapter narrative with choices
   ============================================================ */

(function () {
  const CHAPTERS = [
    {
      id: 0,
      emoji: '🚨',
      title: 'Chương 1: Báo Động Đỏ',
      narration: `Bạn là một tế bào bạch cầu Neutrophil — chiến binh tiên phong của hệ miễn dịch.

Hôm nay, mọi thứ đang yên bình trong mạch máu... cho đến khi tín hiệu hóa học bất ngờ vang lên:

"CẢNH BÁO! Virus Influenza đã xâm nhập qua đường hô hấp! Mô biểu mô phổi đang bị tấn công!"

Các tế bào biểu mô bị nhiễm đang giải phóng cytokine — tín hiệu kêu cứu. Bạn cảm nhận được gradient hóa chất dẫn đường...`,
      knowledge: {
        title: '🧬 Kiến thức: Phản ứng viêm',
        text: 'Khi mô bị tổn thương, tế bào giải phóng histamine và cytokine. Histamine làm giãn mạch máu, tăng tính thấm, giúp bạch cầu dễ dàng di chuyển tới vùng nhiễm (diapedesis). Đây là phản ứng viêm — tuyến phòng thủ đầu tiên!'
      },
      choices: [
        { text: 'Di chuyển theo gradient cytokine tới vùng nhiễm (hóa hướng động)', correct: true },
        { text: 'Ở lại trong mạch máu và chờ lệnh từ tế bào T', correct: false }
      ],
      correctFeedback: '✅ Chính xác! Neutrophil là "lính tiên phong" — đến đầu tiên nhờ hóa hướng động (chemotaxis). Bạn di chuyển xuyên qua thành mạch (diapedesis) tới mô phổi.',
      wrongFeedback: '❌ Neutrophil không cần chờ lệnh tế bào T! Chúng thuộc miễn dịch bẩm sinh — phản ứng ngay lập tức. Hóa hướng động giúp di chuyển theo gradient cytokine.'
    },
    {
      id: 1,
      emoji: '🔍',
      title: 'Chương 2: Nhận Diện Kẻ Thù',
      narration: `Bạn đã đến vùng nhiễm. Khung cảnh thật hỗn loạn — tế bào biểu mô đang chết dần, virus Influenza đang nhân bản nhanh chóng bên trong tế bào chủ.

Trước mặt bạn là một tế bào biểu mô có vẻ... bất thường. Trên bề mặt nó xuất hiện những protein lạ — kháng nguyên virus! Đây có phải là tế bào bị nhiễm?

Nhưng khoan — bạn nhìn thấy MHC-I đang "trưng bày" mảnh kháng nguyên virus trên bề mặt tế bào. Đây là tín hiệu cầu cứu!`,
      knowledge: {
        title: '🧬 Kiến thức: Kháng nguyên & MHC',
        text: 'MHC class I (Major Histocompatibility Complex) có trên MỌI tế bào có nhân. Khi tế bào bị nhiễm virus, MHC-I sẽ "trưng bày" mảnh protein virus (peptide kháng nguyên) lên bề mặt, như cắm "cờ báo động" để tế bào T killer nhận diện và tiêu diệt.'
      },
      choices: [
        { text: 'Nhận diện kháng nguyên qua thụ thể PRR (Pattern Recognition Receptor)', correct: true },
        { text: 'Thử tấn công tất cả tế bào trong vùng để chắc chắn tiêu diệt virus', correct: false }
      ],
      correctFeedback: '✅ Tuyệt vời! Bạch cầu bẩm sinh dùng PRR (như TLR - Toll-like Receptor) để nhận diện PAMP (Pathogen-Associated Molecular Pattern) — các mẫu phân tử đặc trưng của vi sinh vật mà tế bào chủ không có.',
      wrongFeedback: '❌ Tấn công bừa bãi sẽ gây tổn thương mô! Hệ miễn dịch phân biệt "tự thân" (self) và "ngoại lai" (non-self) nhờ các thụ thể đặc hiệu.'
    },
    {
      id: 2,
      emoji: '⚔️',
      title: 'Chương 3: Trận Chiến',
      narration: `Bạn đã xác nhận — đây là virus Influenza! Giờ là lúc chiến đấu!

Bạn có nhiều "vũ khí" trong kho:
• Thực bào (phagocytosis) — nuốt và tiêu hóa virus
• Giải phóng enzyme phân giải
• Tạo lưới bẫy ngoại bào (NETs - Neutrophil Extracellular Traps)

Virus đang cố xâm nhập tế bào mới bằng cách dùng protein Hemagglutinin (HA) để bám vào thụ thể sialic acid...

Bạn phải hành động NGAY!`,
      knowledge: {
        title: '🧬 Kiến thức: Thực bào (Phagocytosis)',
        text: 'Thực bào là cơ chế "nuốt" mầm bệnh: Bạch cầu bao bọc virus bằng giả túc → tạo phagosome → hợp nhất với lysosome → enzyme phân giải tiêu hủy virus. Quá trình này cần ATP và diễn ra rất nhanh!'
      },
      choices: [
        { text: 'Thực bào virus — bao bọc, tạo phagosome, hợp nhất lysosome để tiêu hủy', correct: true },
        { text: 'Giải phóng kháng thể để trung hòa virus', correct: false }
      ],
      correctFeedback: '✅ Chính xác! Neutrophil là "chuyên gia thực bào". Bạn nuốt virus, đưa vào phagosome, hợp nhất với lysosome chứa enzyme phân giải (hydrolase, protease) → tiêu hủy hoàn toàn!',
      wrongFeedback: '❌ Neutrophil KHÔNG tạo kháng thể! Đó là nhiệm vụ của tế bào B (lympho B). Neutrophil chuyên thực bào và tạo NETs. Đây là sự khác biệt giữa miễn dịch bẩm sinh và miễn dịch đặc hiệu.'
    },
    {
      id: 3,
      emoji: '📡',
      title: 'Chương 4: Gọi Viện Binh',
      narration: `Bạn đã tiêu diệt hàng trăm virus, nhưng chúng quá đông! Cần viện binh!

Trong quá trình thực bào, bạn đã "trích xuất" mảnh kháng nguyên virus. Giờ bạn cần trình diện kháng nguyên cho hệ miễn dịch đặc hiệu — gọi đúng loại viện binh.

Hai ứng cử viên:
• Tế bào T Helper (CD4+) — "Tổng chỉ huy" điều phối toàn bộ
• Tế bào T Killer (CD8+) — "Sát thủ" tiêu diệt tế bào bị nhiễm

Bạn sẽ trình diện kháng nguyên cho ai?`,
      knowledge: {
        title: '🧬 Kiến thức: Trình diện kháng nguyên (APC)',
        text: 'Tế bào trình diện kháng nguyên (APC) như Đại thực bào, Tế bào tua (Dendritic cell) "trưng bày" mảnh kháng nguyên trên MHC-II. T Helper (CD4+) nhận diện MHC-II → kích hoạt cả T Killer lẫn B cell. T Helper là "nhạc trưởng" của miễn dịch đặc hiệu!'
      },
      choices: [
        { text: 'Trình diện kháng nguyên trên MHC-II cho tế bào T Helper (CD4+)', correct: true },
        { text: 'Gọi trực tiếp tế bào T Killer mà không qua T Helper', correct: false }
      ],
      correctFeedback: '✅ Hoàn hảo! T Helper (CD4+) là "tổng chỉ huy" — khi được kích hoạt, nó giải phóng cytokine (IL-2, IFN-γ) để đồng thời kích hoạt T Killer VÀ B cell sản xuất kháng thể. Đây là cầu nối giữa miễn dịch bẩm sinh và đặc hiệu!',
      wrongFeedback: '❌ T Killer cần T Helper để kích hoạt hiệu quả! Nếu gọi trực tiếp, phản ứng sẽ yếu và chậm. T Helper là "nhạc trưởng" điều phối toàn bộ miễn dịch đặc hiệu.'
    },
    {
      id: 4,
      emoji: '🛡️',
      title: 'Chương 5: Ghi Nhớ & Chiến Thắng',
      narration: `Viện binh đã đến! T Killer tiêu diệt tế bào bị nhiễm, B cell tạo kháng thể trung hòa virus. Trận chiến gần kết thúc!

Nhưng câu hỏi quan trọng nhất: Nếu virus Influenza quay lại lần sau, cơ thể sẽ phản ứng thế nào?

Sau trận chiến, một số tế bào T và B chuyển thành dạng đặc biệt...`,
      knowledge: {
        title: '🧬 Kiến thức: Tế bào nhớ (Memory Cells)',
        text: 'Sau khi đánh bại mầm bệnh lần đầu (đáp ứng sơ cấp), một phần tế bào T và B chuyển thành TẾ BÀO NHỚ. Khi cùng mầm bệnh xâm nhập lần 2 (đáp ứng thứ cấp), tế bào nhớ phản ứng NHANH hơn, MẠNH hơn, và LƯỢNG KHÁNG THỂ nhiều hơn gấp bội! Đây là nguyên lý của VACCINE.'
      },
      choices: [
        { text: 'Tế bào T và B nhớ sẽ "ghi nhớ" kháng nguyên → đáp ứng thứ cấp nhanh và mạnh hơn', correct: true },
        { text: 'Cơ thể sẽ phản ứng giống hệt lần đầu vì virus là loại mới', correct: false }
      ],
      correctFeedback: '✅ Xuất sắc! Đây chính là BÍ MẬT CỦA VACCINE: Tiêm kháng nguyên bất hoạt/yếu → tạo tế bào nhớ → khi virus thật xâm nhập, đáp ứng thứ cấp nhanh gấp 10 lần, kháng thể nhiều gấp 100 lần! Cơ thể đã "học" xong.',
      wrongFeedback: '❌ KHÔNG giống lần đầu! Đáp ứng thứ cấp (secondary response) nhanh hơn, mạnh hơn nhờ tế bào nhớ. Đây là cơ sở của miễn dịch thu được và nguyên lý vaccine.'
    }
  ];

  let currentChapter = 0;
  let score = 0;
  let correctAnswers = 0;

  function renderChapter(index) {
    const chapter = CHAPTERS[index];
    const container = document.getElementById('storyContent');

    // Update progress
    document.querySelectorAll('.progress-step').forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i < index) step.classList.add('completed');
      if (i === index) step.classList.add('active');
    });

    container.innerHTML = `
      <div class="chapter-label">Chương ${index + 1} / 5</div>
      <div class="story-card">
        <div class="story-illustration">${chapter.emoji}</div>
        <div class="story-content">
          <h2>${chapter.title}</h2>
          <div class="story-narration">${chapter.narration}</div>
          
          <div class="knowledge-box">
            <h4>${chapter.knowledge.title}</h4>
            <p>${chapter.knowledge.text}</p>
          </div>
          
          <h4 style="color: var(--color-light); margin-bottom: var(--space-md);">Bạn sẽ làm gì?</h4>
          <div class="story-choices" id="choices">
            ${chapter.choices.map((c, i) => `
              <button class="choice-btn" data-index="${i}" data-correct="${c.correct}">
                <span class="choice-letter">${String.fromCharCode(65 + i)}</span>
                <span>${c.text}</span>
              </button>
            `).join('')}
          </div>
          
          <div class="story-feedback" id="feedback"></div>
          <button class="continue-btn" id="continueBtn">
            ${index < 4 ? 'Tiếp tục →' : 'Xem kết quả 🏆'}
          </button>
        </div>
      </div>
    `;

    // Choice handlers
    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => handleChoice(btn, chapter));
    });
  }

  function handleChoice(btn, chapter) {
    const isCorrect = btn.dataset.correct === 'true';
    const feedback = document.getElementById('feedback');
    const continueBtn = document.getElementById('continueBtn');

    // Disable all choices
    document.querySelectorAll('.choice-btn').forEach(b => {
      b.style.pointerEvents = 'none';
      if (b.dataset.correct === 'true') {
        b.classList.add('correct');
      } else {
        b.classList.add('wrong');
      }
    });

    // Show feedback
    feedback.className = `story-feedback show ${isCorrect ? 'correct' : 'wrong'}`;
    feedback.textContent = isCorrect ? chapter.correctFeedback : chapter.wrongFeedback;

    // Update score
    if (isCorrect) {
      score += 10;
      correctAnswers++;
    }
    document.getElementById('scoreValue').textContent = score;

    // Show continue button
    continueBtn.classList.add('show');
    continueBtn.addEventListener('click', () => {
      currentChapter++;
      if (currentChapter < CHAPTERS.length) {
        renderChapter(currentChapter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showCompletion();
      }
    });
  }

  function showCompletion() {
    document.getElementById('storyContent').style.display = 'none';
    document.querySelector('.story-progress').style.display = 'none';
    
    const complete = document.getElementById('storyComplete');
    complete.classList.add('show');
    
    document.getElementById('finalScore').textContent = `${score}/50 điểm`;
    document.getElementById('correctCount').textContent = correctAnswers;
    
    // Badge based on score
    let badge = '🔬';
    if (score >= 50) badge = '🏆 Miễn Dịch Master';
    else if (score >= 40) badge = '🛡️ Chiến Binh Xuất Sắc';
    else if (score >= 30) badge = '⚔️ Chiến Binh Dũng Cảm';
    else badge = '🔬 Người Học Chăm Chỉ';
    
    document.getElementById('badgeName').textContent = badge;
    
    // Mark all progress as complete
    document.querySelectorAll('.progress-step').forEach(s => s.classList.add('completed'));
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    renderChapter(0);
  });
})();
