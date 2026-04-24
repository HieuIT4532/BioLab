/* ============================================================
   BioLab X — Chuẩn Hóa Đánh Giá CT GDPT 2018
   📊 Mapping năng lực → chuẩn đầu ra Sinh học phổ thông
   ============================================================ */

const BioLabStandards = (() => {

  // ══════════════════════════════════════════════
  // CHUẨN ĐẦU RA CT GDPT 2018 — KHOA HỌC TỰ NHIÊN
  // ══════════════════════════════════════════════

  const CORE_COMPETENCIES = {
    // 5 Năng lực chung
    general: [
      { id: 'NLC1', name: 'Tự chủ và tự học', icon: '📖', weight: 1.0 },
      { id: 'NLC2', name: 'Giao tiếp và hợp tác', icon: '🤝', weight: 1.0 },
      { id: 'NLC3', name: 'Giải quyết vấn đề và sáng tạo', icon: '💡', weight: 1.2 },
      { id: 'NLC4', name: 'Năng lực ngôn ngữ', icon: '📝', weight: 0.8 },
      { id: 'NLC5', name: 'Năng lực tính toán và CNTT', icon: '💻', weight: 1.0 }
    ],
    // 3 Năng lực khoa học tự nhiên
    scientific: [
      { id: 'NLKH1', name: 'Nhận thức khoa học tự nhiên', icon: '🧠', weight: 1.2,
        indicators: [
          { id: 'NLKH1.1', name: 'Nhận biết và nêu được', level: 'NB', bloom: 'remember' },
          { id: 'NLKH1.2', name: 'Trình bày và giải thích được', level: 'TH', bloom: 'understand' },
          { id: 'NLKH1.3', name: 'Phân tích và so sánh được', level: 'VD', bloom: 'analyze' },
          { id: 'NLKH1.4', name: 'Đánh giá và đề xuất được', level: 'VDC', bloom: 'evaluate' }
        ]
      },
      { id: 'NLKH2', name: 'Tìm hiểu tự nhiên', icon: '🔬', weight: 1.3,
        indicators: [
          { id: 'NLKH2.1', name: 'Đặt câu hỏi nghiên cứu', level: 'NB', bloom: 'remember' },
          { id: 'NLKH2.2', name: 'Xây dựng giả thuyết', level: 'TH', bloom: 'understand' },
          { id: 'NLKH2.3', name: 'Lập kế hoạch thí nghiệm', level: 'VD', bloom: 'apply' },
          { id: 'NLKH2.4', name: 'Thực hiện thí nghiệm', level: 'VD', bloom: 'apply' },
          { id: 'NLKH2.5', name: 'Thu thập và xử lý dữ liệu', level: 'VD', bloom: 'analyze' },
          { id: 'NLKH2.6', name: 'Rút ra kết luận', level: 'VDC', bloom: 'evaluate' },
          { id: 'NLKH2.7', name: 'Viết báo cáo khoa học', level: 'VDC', bloom: 'create' }
        ]
      },
      { id: 'NLKH3', name: 'Vận dụng kiến thức, kĩ năng', icon: '🌍', weight: 1.1,
        indicators: [
          { id: 'NLKH3.1', name: 'Giải thích hiện tượng thực tiễn', level: 'VD', bloom: 'apply' },
          { id: 'NLKH3.2', name: 'Đề xuất giải pháp', level: 'VDC', bloom: 'create' },
          { id: 'NLKH3.3', name: 'Đánh giá tác động', level: 'VDC', bloom: 'evaluate' }
        ]
      }
    ]
  };

  // ══════════════════════════════════════════════
  // BLOOM TAXONOMY LEVELS
  // ══════════════════════════════════════════════
  const BLOOM_LEVELS = {
    remember:    { name: 'Nhận biết', level: 1, color: '#00D4AA', vi: 'NB' },
    understand:  { name: 'Thông hiểu', level: 2, color: '#00BCD4', vi: 'TH' },
    apply:       { name: 'Vận dụng', level: 3, color: '#7C4DFF', vi: 'VD' },
    analyze:     { name: 'Phân tích', level: 4, color: '#E040FB', vi: 'PT' },
    evaluate:    { name: 'Đánh giá', level: 5, color: '#FF4081', vi: 'ĐG' },
    create:      { name: 'Sáng tạo', level: 6, color: '#FFD740', vi: 'ST' }
  };

  // ══════════════════════════════════════════════
  // ACTIVITY → STANDARD MAPPING
  // ══════════════════════════════════════════════
  const ACTIVITY_MAPPING = {
    'experiment_run': ['NLKH2.4', 'NLKH2.5'],
    'hypothesis_created': ['NLKH2.2'],
    'data_exported': ['NLKH2.5'],
    'report_written': ['NLKH2.7', 'NLC4'],
    'quiz_completed': ['NLKH1.1', 'NLKH1.2'],
    'quiz_perfect': ['NLKH1.3', 'NLKH1.4'],
    'crispr_completed': ['NLKH1.3', 'NLKH3.1'],
    'observation_uploaded': ['NLKH2.1', 'NLKH3.3'],
    'project_created': ['NLKH3.2', 'NLC3'],
    'ai_interaction': ['NLC5'],
    'collaboration': ['NLC2'],
    'self_study': ['NLC1'],
    'data_analysis': ['NLKH2.5', 'NLKH2.6', 'NLC5'],
    'conclusion_written': ['NLKH2.6'],
    'peer_review': ['NLC2', 'NLKH1.4'],
    'presentation': ['NLC4', 'NLKH2.7']
  };

  // ══════════════════════════════════════════════
  // ASSESSMENT ENGINE
  // ══════════════════════════════════════════════

  const ASSESS_KEY = 'biolab_assessment';

  function getAssessment() {
    try {
      const stored = localStorage.getItem(ASSESS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* silent */ }
    return _createDefaultAssessment();
  }

  function saveAssessment(assessment) {
    assessment.lastUpdated = new Date().toISOString();
    localStorage.setItem(ASSESS_KEY, JSON.stringify(assessment));
  }

  function _createDefaultAssessment() {
    const assessment = {
      indicators: {},
      competencies: {},
      bloomProgress: {},
      lastUpdated: null
    };

    // Initialize all indicators
    CORE_COMPETENCIES.scientific.forEach(comp => {
      assessment.competencies[comp.id] = { score: 0, activities: 0, level: 'NB' };
      if (comp.indicators) {
        comp.indicators.forEach(ind => {
          assessment.indicators[ind.id] = {
            score: 0,
            maxScore: 100,
            activities: 0,
            bloom: ind.bloom,
            achieved: false
          };
        });
      }
    });

    // Initialize general competencies
    CORE_COMPETENCIES.general.forEach(comp => {
      assessment.competencies[comp.id] = { score: 0, activities: 0, level: 'NB' };
    });

    // Bloom progress
    Object.keys(BLOOM_LEVELS).forEach(level => {
      assessment.bloomProgress[level] = { achieved: 0, total: 0, percent: 0 };
    });

    saveAssessment(assessment);
    return assessment;
  }

  // Record an activity and update standards
  function recordActivity(activityType, score = 50, metadata = {}) {
    const assessment = getAssessment();
    const mappedIndicators = ACTIVITY_MAPPING[activityType] || [];

    mappedIndicators.forEach(indicatorId => {
      if (assessment.indicators[indicatorId]) {
        const ind = assessment.indicators[indicatorId];
        ind.activities++;
        ind.score = Math.min(100, Math.round(ind.score * 0.7 + score * 0.3));
        ind.achieved = ind.score >= 60;

        // Update parent competency
        const compId = indicatorId.substring(0, indicatorId.lastIndexOf('.'));
        if (assessment.competencies[compId]) {
          _recalcCompetency(assessment, compId);
        }
      } else if (assessment.competencies[indicatorId]) {
        // Direct competency update (for general competencies)
        const comp = assessment.competencies[indicatorId];
        comp.activities++;
        comp.score = Math.min(100, Math.round(comp.score * 0.7 + score * 0.3));
      }
    });

    // Update bloom progress
    _recalcBloom(assessment);
    saveAssessment(assessment);

    window.dispatchEvent(new CustomEvent('biolab:standard_update', {
      detail: { activityType, indicators: mappedIndicators, score }
    }));
  }

  function _recalcCompetency(assessment, compId) {
    const comp = CORE_COMPETENCIES.scientific.find(c => c.id === compId);
    if (!comp || !comp.indicators) return;

    const scores = comp.indicators.map(ind => assessment.indicators[ind.id]?.score || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    assessment.competencies[compId].score = Math.round(avg);

    // Determine level
    if (avg >= 80) assessment.competencies[compId].level = 'VDC';
    else if (avg >= 60) assessment.competencies[compId].level = 'VD';
    else if (avg >= 40) assessment.competencies[compId].level = 'TH';
    else assessment.competencies[compId].level = 'NB';
  }

  function _recalcBloom(assessment) {
    Object.keys(BLOOM_LEVELS).forEach(level => {
      const indicators = [];
      CORE_COMPETENCIES.scientific.forEach(comp => {
        if (comp.indicators) {
          comp.indicators.forEach(ind => {
            if (ind.bloom === level) indicators.push(ind.id);
          });
        }
      });

      const achieved = indicators.filter(id => assessment.indicators[id]?.achieved).length;
      assessment.bloomProgress[level] = {
        achieved,
        total: indicators.length,
        percent: indicators.length > 0 ? Math.round(achieved / indicators.length * 100) : 0
      };
    });
  }

  // Get full report for display
  function getReport() {
    const assessment = getAssessment();
    return {
      competencies: CORE_COMPETENCIES,
      scores: assessment.competencies,
      indicators: assessment.indicators,
      bloomProgress: assessment.bloomProgress,
      bloomLevels: BLOOM_LEVELS,
      overallScore: _calcOverall(assessment),
      achievedIndicators: Object.values(assessment.indicators).filter(i => i.achieved).length,
      totalIndicators: Object.values(assessment.indicators).length,
      lastUpdated: assessment.lastUpdated
    };
  }

  function _calcOverall(assessment) {
    const sciScores = CORE_COMPETENCIES.scientific.map(c => {
      const comp = assessment.competencies[c.id];
      return (comp?.score || 0) * c.weight;
    });
    const totalWeight = CORE_COMPETENCIES.scientific.reduce((a, c) => a + c.weight, 0);
    return Math.round(sciScores.reduce((a, b) => a + b, 0) / totalWeight);
  }

  // ── Public API ──
  return {
    CORE_COMPETENCIES,
    BLOOM_LEVELS,
    ACTIVITY_MAPPING,
    getAssessment,
    recordActivity,
    getReport
  };
})();

if (typeof window !== 'undefined') {
  window.BioLabStandards = BioLabStandards;
}
