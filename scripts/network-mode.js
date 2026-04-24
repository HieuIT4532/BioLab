/* ============================================================
   BioLab X — Network Mode (Liên Trường - Liên Tỉnh)
   🏆 Leaderboards, Inter-school Projects, Real-time Sync
   ============================================================ */

const BioLabNetwork = (() => {

  const MOCK_SCHOOLS = [
    { id: 'S1', name: 'THPT Nguyễn Huệ', province: 'Hà Nội', score: 14500, students: 320, projects: 12 },
    { id: 'S2', name: 'THPT Lê Quý Đôn', province: 'Đà Nẵng', score: 13800, students: 280, projects: 15 },
    { id: 'S3', name: 'THPT Chuyên Trần Đại Nghĩa', province: 'TP.HCM', score: 18200, students: 450, projects: 25 },
    { id: 'S4', name: 'THPT Phan Bội Châu', province: 'Nghệ An', score: 12100, students: 210, projects: 8 },
    { id: 'S5', name: 'THPT Chuyên Lam Sơn', province: 'Thanh Hóa', score: 11500, students: 195, projects: 10 }
  ];

  const MOCK_PROVINCES = [
    { name: 'TP.HCM', score: 85000, rank: 1 },
    { name: 'Hà Nội', score: 82000, rank: 2 },
    { name: 'Đà Nẵng', score: 65000, rank: 3 },
    { name: 'Nghệ An', score: 58000, rank: 4 },
    { name: 'Thanh Hóa', score: 54000, rank: 5 }
  ];

  function getLeaderboard(type = 'school') {
    if (type === 'school') {
      return MOCK_SCHOOLS.sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));
    } else if (type === 'province') {
      return MOCK_PROVINCES.sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));
    }
    return [];
  }

  function getActiveProjects() {
    return [
      { id: 'P1', title: 'Khảo sát vi nhựa trong nguồn nước', schools: ['THPT Nguyễn Huệ', 'THPT Lê Quý Đôn'], participants: 45, progress: 65 },
      { id: 'P2', title: 'Bản đồ hệ thực vật Rừng Quốc Gia', schools: ['THPT Phan Bội Châu', 'THPT Chuyên Lam Sơn'], participants: 120, progress: 40 },
      { id: 'P3', title: 'Mô hình dự đoán dịch bệnh qua AI', schools: ['THPT Chuyên Trần Đại Nghĩa'], participants: 15, progress: 85 }
    ];
  }

  return { getLeaderboard, getActiveProjects };
})();

if (typeof window !== 'undefined') {
  window.BioLabNetwork = BioLabNetwork;
}
