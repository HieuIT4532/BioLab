/* ============================================================
   BioLab X — Digital Twin Học Sinh
   🧠 Hệ thống theo dõi hành vi + tạo bản sao năng lực
   Tracks: experiment behavior, thinking time, mistake patterns
   Generates: scientific thinking profile, cognitive style
   ============================================================ */

const BioLabTwin = (() => {
  const TWIN_KEY = 'biolab_digital_twin';

  // ── Default Twin Profile ──
  function createDefault() {
    return {
      // 6-dimension Scientific Capability
      scientificProfile: {
        observation: 0,        // Quan sát
        hypothesis: 0,         // Đặt giả thuyết
        experimentDesign: 0,   // Thiết kế TN
        dataAnalysis: 0,       // Phân tích dữ liệu
        conclusion: 0,         // Kết luận
        communication: 0       // Trình bày
      },
      // Cognitive style classification
      cognitiveStyle: {
        primary: 'unknown',    // visual | analytical | experimental | systematic
        scores: { visual: 0, analytical: 0, experimental: 0, systematic: 0 },
        lastUpdated: null
      },
      // Behavior tracking
      behaviorLog: [],          // [{action, timestamp, zone, duration, correct}]
      // Mistake patterns
      mistakeHistory: [],       // [{pattern, category, count, lastOccurrence, improving}]
      // Thinking time metrics
      thinkingMetrics: {
        avgDecisionTime: 0,     // seconds
        fastDecisions: 0,
        thoughtfulDecisions: 0,
        totalDecisions: 0,
        decisionTimes: []       // last 50
      },
      // Experiment behavior
      experimentBehavior: {
        avgStepsPerExperiment: 0,
        controlVariableUsage: 0,  // % times used control variables
        hypothesisBeforeExperiment: 0, // % times made hypothesis first
        dataExportCount: 0,
        repeatExperiments: 0,
        totalExperiments: 0
      },
      // Strengths & weaknesses
      strengths: [],
      weaknesses: [],
      // AI recommendations
      recommendations: [],
      // Timeline data for heatmap
      activityHeatmap: {},  // { 'YYYY-MM-DD': { hours: {0..23: count} } }
      lastUpdated: null
    };
  }

  // ── Get / Save Twin ──
  function get() {
    try {
      const stored = localStorage.getItem(TWIN_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* silent */ }
    const twin = createDefault();
    save(twin);
    return twin;
  }

  function save(twin) {
    twin.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(TWIN_KEY, JSON.stringify(twin));
    } catch (e) { console.warn('BioLab Twin: Could not save', e); }
    // Sync to Firebase if available
    if (window.BioLabFirebase?.isOnline()) {
      const user = BioLabFirebase.Auth.getUser();
      if (user) {
        BioLabFirebase.DB.set(`students/${user.uid}/digitalTwin`, twin);
      }
    }
  }

  // ══════════════════════════════════════════════
  // BEHAVIOR TRACKING
  // ══════════════════════════════════════════════

  // Track any action the student takes
  function trackAction(action, zone, metadata = {}) {
    const twin = get();
    const entry = {
      action,
      zone,
      timestamp: Date.now(),
      ...metadata
    };
    twin.behaviorLog.push(entry);
    // Keep last 500
    if (twin.behaviorLog.length > 500) {
      twin.behaviorLog = twin.behaviorLog.slice(-500);
    }
    // Update heatmap
    _updateHeatmap(twin);
    save(twin);
    return entry;
  }

  // Track thinking/decision time (call startThinking → endThinking)
  let _thinkingStart = null;

  function startThinking() {
    _thinkingStart = Date.now();
  }

  function endThinking(action, correct = true) {
    if (!_thinkingStart) return;
    const duration = (Date.now() - _thinkingStart) / 1000;
    _thinkingStart = null;

    const twin = get();
    const metrics = twin.thinkingMetrics;
    metrics.totalDecisions++;
    metrics.decisionTimes.push(duration);
    if (metrics.decisionTimes.length > 50) {
      metrics.decisionTimes = metrics.decisionTimes.slice(-50);
    }
    metrics.avgDecisionTime = metrics.decisionTimes.reduce((a, b) => a + b, 0) / metrics.decisionTimes.length;

    if (duration < 3) {
      metrics.fastDecisions++;
    } else if (duration > 10) {
      metrics.thoughtfulDecisions++;
    }

    // Update cognitive style based on behavior
    if (duration < 3 && correct) twin.cognitiveStyle.scores.experimental += 1;
    if (duration > 10 && correct) twin.cognitiveStyle.scores.analytical += 1;
    if (duration > 5 && duration < 15) twin.cognitiveStyle.scores.systematic += 1;

    save(twin);
    return { duration, correct };
  }

  // ══════════════════════════════════════════════
  // MISTAKE PATTERN DETECTION
  // ══════════════════════════════════════════════

  function recordMistake(category, pattern, zone) {
    const twin = get();
    const existing = twin.mistakeHistory.find(m => m.pattern === pattern && m.category === category);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = Date.now();
      // Check if improving (gap between mistakes increasing)
      if (existing.prevGap) {
        const currentGap = Date.now() - existing.prevTimestamp;
        existing.improving = currentGap > existing.prevGap;
      }
      existing.prevGap = Date.now() - (existing.prevTimestamp || Date.now());
      existing.prevTimestamp = Date.now();
    } else {
      twin.mistakeHistory.push({
        category,
        pattern,
        zone,
        count: 1,
        firstOccurrence: Date.now(),
        lastOccurrence: Date.now(),
        prevTimestamp: Date.now(),
        prevGap: null,
        improving: false
      });
    }

    // Keep last 100
    if (twin.mistakeHistory.length > 100) {
      twin.mistakeHistory = twin.mistakeHistory.slice(-100);
    }

    save(twin);
  }

  // ══════════════════════════════════════════════
  // SCIENTIFIC PROFILE SCORING
  // ══════════════════════════════════════════════

  function updateScientificScore(dimension, score) {
    const twin = get();
    if (twin.scientificProfile.hasOwnProperty(dimension)) {
      // Weighted rolling average (70% old, 30% new)
      twin.scientificProfile[dimension] = Math.round(
        twin.scientificProfile[dimension] * 0.7 + score * 0.3
      );
      _updateStrengthsWeaknesses(twin);
      save(twin);
    }
  }

  function recordExperimentBehavior(data) {
    const twin = get();
    const eb = twin.experimentBehavior;
    eb.totalExperiments++;
    if (data.usedControlVariable) eb.controlVariableUsage++;
    if (data.madeHypothesisFirst) eb.hypothesisBeforeExperiment++;
    if (data.exportedData) eb.dataExportCount++;
    if (data.isRepeat) eb.repeatExperiments++;
    if (data.steps) {
      eb.avgStepsPerExperiment = Math.round(
        (eb.avgStepsPerExperiment * (eb.totalExperiments - 1) + data.steps) / eb.totalExperiments
      );
    }

    // Update scientific profile based on experiment behavior
    if (data.usedControlVariable) updateScientificScore('experimentDesign', 75);
    if (data.madeHypothesisFirst) updateScientificScore('hypothesis', 70);
    if (data.analyzedData) updateScientificScore('dataAnalysis', 65);
    if (data.wroteConclusion) updateScientificScore('conclusion', 60);

    save(twin);
  }

  // ══════════════════════════════════════════════
  // COGNITIVE STYLE CLASSIFICATION
  // ══════════════════════════════════════════════

  function classifyCognitiveStyle() {
    const twin = get();
    const scores = twin.cognitiveStyle.scores;
    const max = Math.max(scores.visual, scores.analytical, scores.experimental, scores.systematic);

    if (max === 0) {
      twin.cognitiveStyle.primary = 'unknown';
    } else if (scores.analytical === max) {
      twin.cognitiveStyle.primary = 'analytical';
    } else if (scores.experimental === max) {
      twin.cognitiveStyle.primary = 'experimental';
    } else if (scores.systematic === max) {
      twin.cognitiveStyle.primary = 'systematic';
    } else {
      twin.cognitiveStyle.primary = 'visual';
    }

    twin.cognitiveStyle.lastUpdated = new Date().toISOString();
    save(twin);
    return twin.cognitiveStyle;
  }

  const COGNITIVE_STYLES = {
    visual: {
      name: 'Nhà Quan Sát',
      emoji: '👁️',
      desc: 'Bạn học tốt nhất qua hình ảnh, biểu đồ và mô hình 3D. Bạn nhận ra xu hướng dữ liệu nhanh.',
      color: '#00D4AA'
    },
    analytical: {
      name: 'Nhà Phân Tích',
      emoji: '🧮',
      desc: 'Bạn thích suy nghĩ sâu, phân tích từng chi tiết. Bạn ít mắc lỗi vì cẩn thận.',
      color: '#7C4DFF'
    },
    experimental: {
      name: 'Nhà Thực Nghiệm',
      emoji: '🧪',
      desc: 'Bạn thích làm thử, nhanh tay, đúc kết từ kinh nghiệm. Bạn dám thí nghiệm!',
      color: '#FF4081'
    },
    systematic: {
      name: 'Nhà Hệ Thống',
      emoji: '📐',
      desc: 'Bạn theo quy trình khoa học chuẩn. Bạn luôn có giả thuyết trước khi thí nghiệm.',
      color: '#FFD740'
    },
    unknown: {
      name: 'Đang Khám Phá',
      emoji: '🔍',
      desc: 'Hãy làm thêm thí nghiệm để hệ thống nhận diện phong cách của bạn!',
      color: '#8892B0'
    }
  };

  // ══════════════════════════════════════════════
  // INTERNAL HELPERS
  // ══════════════════════════════════════════════

  function _updateStrengthsWeaknesses(twin) {
    const sp = twin.scientificProfile;
    const entries = Object.entries(sp).sort((a, b) => b[1] - a[1]);

    const LABELS = {
      observation: 'Quan sát',
      hypothesis: 'Đặt giả thuyết',
      experimentDesign: 'Thiết kế thí nghiệm',
      dataAnalysis: 'Phân tích dữ liệu',
      conclusion: 'Kết luận',
      communication: 'Trình bày khoa học'
    };

    twin.strengths = entries.filter(e => e[1] >= 60).slice(0, 3).map(e => LABELS[e[0]]);
    twin.weaknesses = entries.filter(e => e[1] < 40 && e[1] > 0).slice(-3).map(e => LABELS[e[0]]);

    // AI recommendations
    twin.recommendations = [];
    if (sp.hypothesis < 30) twin.recommendations.push('Hãy tập đặt giả thuyết trước mỗi thí nghiệm');
    if (sp.dataAnalysis < 30) twin.recommendations.push('Hãy thử xuất dữ liệu CSV và phân tích biểu đồ');
    if (sp.conclusion < 30) twin.recommendations.push('Hãy viết kết luận cho mỗi thí nghiệm bạn hoàn thành');
    if (sp.experimentDesign < 30) twin.recommendations.push('Hãy sử dụng biến kiểm soát trong thí nghiệm');
    if (sp.communication < 30) twin.recommendations.push('Hãy thử viết báo cáo khoa học đầy đủ');
    if (sp.observation < 30) twin.recommendations.push('Hãy quan sát kỹ hơn trước khi bắt đầu thí nghiệm');
  }

  function _updateHeatmap(twin) {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const hour = now.getHours();

    if (!twin.activityHeatmap[dateKey]) {
      twin.activityHeatmap[dateKey] = { hours: {} };
    }
    twin.activityHeatmap[dateKey].hours[hour] = (twin.activityHeatmap[dateKey].hours[hour] || 0) + 1;

    // Keep last 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffKey = cutoff.toISOString().split('T')[0];
    for (const key in twin.activityHeatmap) {
      if (key < cutoffKey) delete twin.activityHeatmap[key];
    }
  }

  // ══════════════════════════════════════════════
  // GET SUMMARY (for display)
  // ══════════════════════════════════════════════

  function getSummary() {
    const twin = get();
    classifyCognitiveStyle();
    const style = COGNITIVE_STYLES[twin.cognitiveStyle.primary];
    const sp = twin.scientificProfile;
    const avgScore = Math.round(Object.values(sp).reduce((a, b) => a + b, 0) / 6);

    return {
      scientificProfile: sp,
      cognitiveStyle: { ...twin.cognitiveStyle, ...style },
      thinkingMetrics: twin.thinkingMetrics,
      experimentBehavior: twin.experimentBehavior,
      mistakePatterns: twin.mistakeHistory.filter(m => m.count > 1).slice(-10),
      strengths: twin.strengths,
      weaknesses: twin.weaknesses,
      recommendations: twin.recommendations,
      averageScore: avgScore,
      activityHeatmap: twin.activityHeatmap,
      totalActions: twin.behaviorLog.length
    };
  }

  // ── Public API ──
  return {
    get,
    save,
    trackAction,
    startThinking,
    endThinking,
    recordMistake,
    updateScientificScore,
    recordExperimentBehavior,
    classifyCognitiveStyle,
    getSummary,
    COGNITIVE_STYLES
  };
})();

if (typeof window !== 'undefined') {
  window.BioLabTwin = BioLabTwin;
}
