/* ============================================================
   BioLab — Data Layer
   Student profiles, learning analytics, progress tracking
   Persisted in localStorage for demo (Firebase-ready structure)
   ============================================================ */

const BioLabData = (() => {

  const STORAGE_KEY = 'bioverse_profile';
  const ANALYTICS_KEY = 'bioverse_analytics';

  // ── Default Student Profile ──
  function createDefaultProfile() {
    return {
      id: 'student_' + Date.now(),
      name: 'Nhà Khoa Học Mới',
      avatar: '🧬',
      createdAt: new Date().toISOString(),
      level: 1,
      xp: 0,
      totalXP: 0,
      badges: [],
      completedModules: [],
      experimentCount: 0,
      // Competency scores (0-100, chuẩn GDPT 2018)
      competencies: {
        biologicalKnowledge: 0,    // Nhận thức sinh học
        experimentalSkills: 0,     // Thực hành thí nghiệm
        scientificThinking: 0,     // Tư duy khoa học
        problemSolving: 0          // Giải quyết vấn đề
      },
      // Zone-specific progress
      zones: {
        explore: { visited: false, progress: 0, modules: {} },
        experiment: { visited: false, progress: 0, modules: {} },
        biotech: { visited: false, progress: 0, modules: {} },
        innovate: { visited: false, progress: 0, modules: {} },
        nature: { visited: false, progress: 0, modules: {} },
        resource: { visited: false, progress: 0, modules: {} }
      },
      // Recent activity timeline
      recentActivity: [],
      // Settings
      settings: {
        difficulty: 'normal', // easy, normal, hard
        notifications: true,
        language: 'vi'
      }
    };
  }

  // ── Profile Management ──
  const Profile = {
    get() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
      } catch (e) { /* silent */ }
      const profile = createDefaultProfile();
      this.save(profile);
      return profile;
    },

    save(profile) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (e) { console.warn('BioLab: Could not save profile', e); }
    },

    update(updates) {
      const profile = this.get();
      Object.assign(profile, updates);
      this.save(profile);
      return profile;
    },

    addXP(amount, source = '') {
      const profile = this.get();
      profile.xp += amount;
      profile.totalXP += amount;

      // Level up check
      const xpForNextLevel = this.getXPForLevel(profile.level + 1);
      let leveledUp = false;
      while (profile.xp >= xpForNextLevel) {
        profile.xp -= xpForNextLevel;
        profile.level++;
        leveledUp = true;
      }

      this.addActivity({
        type: 'xp',
        amount,
        source,
        leveledUp,
        newLevel: profile.level
      });

      this.save(profile);
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('bioverse:xp', {
        detail: { amount, source, totalXP: profile.totalXP, level: profile.level, leveledUp }
      }));

      if (leveledUp) {
        window.dispatchEvent(new CustomEvent('bioverse:levelup', {
          detail: { level: profile.level, title: this.getLevelTitle(profile.level) }
        }));
      }

      return profile;
    },

    getXPForLevel(level) {
      return Math.floor(100 * Math.pow(1.5, level - 1));
    },

    getLevelTitle(level) {
      const titles = [
        { min: 1, title: 'Nhà Khoa Học Tập Sự', emoji: '🔬' },
        { min: 3, title: 'Trợ Lý Nghiên Cứu', emoji: '🧪' },
        { min: 5, title: 'Nghiên Cứu Sinh', emoji: '📊' },
        { min: 8, title: 'Nhà Sinh Học', emoji: '🧬' },
        { min: 12, title: 'Chuyên Gia Sinh Học', emoji: '🏆' },
        { min: 16, title: 'Tiến Sĩ Sinh Học', emoji: '🎓' },
        { min: 20, title: 'Giáo Sư', emoji: '👨‍🔬' },
        { min: 25, title: 'Viện Sĩ', emoji: '🌟' }
      ];
      for (let i = titles.length - 1; i >= 0; i--) {
        if (level >= titles[i].min) return titles[i];
      }
      return titles[0];
    },

    getXPProgress() {
      const profile = this.get();
      const needed = this.getXPForLevel(profile.level + 1);
      return {
        current: profile.xp,
        needed,
        percent: Math.round((profile.xp / needed) * 100)
      };
    },

    addActivity(activity) {
      const profile = this.get();
      profile.recentActivity.unshift({
        ...activity,
        timestamp: new Date().toISOString()
      });
      // Keep last 50
      if (profile.recentActivity.length > 50) {
        profile.recentActivity = profile.recentActivity.slice(0, 50);
      }
      this.save(profile);
    },

    updateCompetency(competency, score) {
      const profile = this.get();
      if (profile.competencies.hasOwnProperty(competency)) {
        // Weighted average (70% old + 30% new)
        profile.competencies[competency] = Math.round(
          profile.competencies[competency] * 0.7 + score * 0.3
        );
        this.save(profile);
      }
      return profile;
    },

    updateZoneProgress(zone, moduleName, progress) {
      const profile = this.get();
      if (profile.zones[zone]) {
        profile.zones[zone].visited = true;
        profile.zones[zone].modules[moduleName] = Math.max(
          profile.zones[zone].modules[moduleName] || 0,
          progress
        );
        // Calculate overall zone progress
        const modules = Object.values(profile.zones[zone].modules);
        profile.zones[zone].progress = modules.length > 0
          ? Math.round(modules.reduce((a, b) => a + b, 0) / modules.length)
          : 0;
        this.save(profile);
      }
      return profile;
    },

    incrementExperiments() {
      const profile = this.get();
      profile.experimentCount++;
      this.save(profile);
      return profile;
    },

    reset() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANALYTICS_KEY);
      return createDefaultProfile();
    }
  };

  // ── Analytics Engine ──
  const Analytics = {
    track(event) {
      try {
        const events = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
        events.push({
          ...event,
          timestamp: new Date().toISOString(),
          sessionId: this._getSessionId()
        });
        // Keep last 500 events
        if (events.length > 500) events.splice(0, events.length - 500);
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events));
      } catch (e) { /* silent */ }
    },

    getEvents(type = null, limit = 100) {
      try {
        let events = JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
        if (type) events = events.filter(e => e.type === type);
        return events.slice(-limit);
      } catch (e) { return []; }
    },

    getStats() {
      const events = this.getEvents();
      const profile = Profile.get();
      return {
        totalEvents: events.length,
        experimentsRun: events.filter(e => e.type === 'experiment_run').length,
        quizzesTaken: events.filter(e => e.type === 'quiz_complete').length,
        modulesVisited: events.filter(e => e.type === 'module_visit').length,
        timeSpent: this._calcTimeSpent(events),
        profile
      };
    },

    _getSessionId() {
      if (!this._sessionId) {
        this._sessionId = 'session_' + Date.now();
      }
      return this._sessionId;
    },

    _calcTimeSpent(events) {
      if (events.length < 2) return 0;
      const first = new Date(events[0].timestamp);
      const last = new Date(events[events.length - 1].timestamp);
      return Math.round((last - first) / 60000); // minutes
    }
  };

  // ── Badge System ──
  const Badges = {
    definitions: [
      { id: 'first_experiment', name: 'Thí Nghiệm Đầu Tiên', emoji: '🧪', desc: 'Hoàn thành thí nghiệm đầu tiên', condition: p => p.experimentCount >= 1 },
      { id: 'lab_expert', name: 'Chuyên gia Lab', emoji: '⚗️', desc: 'Hoàn thành 10 thí nghiệm', condition: p => p.experimentCount >= 10 },
      { id: 'genetics_master', name: 'Bậc thầy Di truyền', emoji: '🧬', desc: 'Hoàn thành module CRISPR', condition: p => p.zones.biotech?.modules?.crispr >= 100 },
      { id: 'explorer', name: 'Người Khám phá', emoji: '🔍', desc: 'Khám phá tất cả khu vực', condition: p => Object.values(p.zones).every(z => z.visited) },
      { id: 'scientist', name: 'Nhà Khoa Học', emoji: '👨‍🔬', desc: 'Đạt cấp độ 5', condition: p => p.level >= 5 },
      { id: 'data_analyst', name: 'Nhà phân tích dữ liệu', emoji: '📊', desc: 'Xuất 5 bộ dữ liệu CSV', condition: p => (p._csvExports || 0) >= 5 },
      { id: 'innovator', name: 'Nhà đổi mới', emoji: '💡', desc: 'Tạo dự án khoa học đầu tiên', condition: p => p.zones.innovate?.modules?.project >= 50 },
      { id: 'citizen_scientist', name: 'Nhà khoa học cộng đồng', emoji: '🌿', desc: 'Tải lên 3 quan sát thực địa', condition: p => (p._observations || 0) >= 3 },
      { id: 'ai_whisperer', name: 'Bậc thầy AI', emoji: '🤖', desc: 'Tương tác Gia sư AI 20 lần', condition: p => (p._aiInteractions || 0) >= 20 },
      { id: 'vaccine_hero', name: 'Người hùng Vaccine', emoji: '💉', desc: 'Xây dựng vaccine thành công', condition: p => p.zones.biotech?.modules?.vaccine >= 100 },
      { id: 'perfect_score', name: 'Điểm tuyệt đối', emoji: '🏅', desc: 'Đạt 100% câu hỏi trắc nghiệm', condition: p => (p._perfectQuizzes || 0) >= 1 },
      { id: 'streak_7', name: 'Chuỗi 7 ngày', emoji: '🔥', desc: 'Học 7 ngày liên tục', condition: p => (p._streak || 0) >= 7 }
    ],

    check() {
      const profile = Profile.get();
      let newBadges = [];
      for (const badge of this.definitions) {
        if (!profile.badges.includes(badge.id) && badge.condition(profile)) {
          profile.badges.push(badge.id);
          newBadges.push(badge);
        }
      }
      if (newBadges.length > 0) {
        Profile.save(profile);
        newBadges.forEach(b => {
          window.dispatchEvent(new CustomEvent('bioverse:badge', { detail: b }));
        });
      }
      return newBadges;
    },

    getEarned() {
      const profile = Profile.get();
      return this.definitions.filter(b => profile.badges.includes(b.id));
    },

    getAll() {
      const profile = Profile.get();
      return this.definitions.map(b => ({
        ...b,
        earned: profile.badges.includes(b.id)
      }));
    }
  };

  return { Profile, Analytics, Badges };
})();

if (typeof window !== 'undefined') {
  window.BioLabData = BioLabData;
}
