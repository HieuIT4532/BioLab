/* ============================================================
   BioLab X — Citizen Science (Dataset Quốc Gia)
   🌿 Học sinh toàn quốc upload dữ liệu sinh thái
   ============================================================ */

const BioLabCitizen = (() => {

  const DATASET_KEY = 'biolab_citizen_dataset';

  function getDataset() {
    try {
      const data = localStorage.getItem(DATASET_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  }

  function saveDataset(data) {
    localStorage.setItem(DATASET_KEY, JSON.stringify(data));
    // If Firebase is online, sync it to national dataset
    if (window.BioLabFirebase && BioLabFirebase.isOnline()) {
      BioLabFirebase.DB.set('national_dataset/latest', data.slice(-50)); // Sync last 50 for demo
    }
  }

  function uploadObservation(observation) {
    const data = getDataset();
    const newObs = {
      id: 'obs_' + Date.now(),
      timestamp: new Date().toISOString(),
      studentId: window.BioLabFirebase?.Auth?.getUser()?.uid || 'anonymous',
      studentName: window.BioLabFirebase?.Auth?.getUser()?.displayName || 'Ẩn danh',
      ...observation
    };
    data.push(newObs);
    saveDataset(data);
    
    // Reward student
    if (window.BioLabData) {
      BioLabData.Profile.addXP(50, 'Đóng góp Citizen Science');
    }
    if (window.BioLabTwin) {
      BioLabTwin.trackAction('upload_observation', 'citizen_science');
    }
    if (window.BioLabStandards) {
      BioLabStandards.recordActivity('observation_uploaded', 80);
    }
    
    return newObs;
  }

  function getStats() {
    const data = getDataset();
    const speciesCount = new Set(data.map(d => d.speciesName)).size;
    return {
      totalObservations: data.length,
      uniqueSpecies: speciesCount,
      contributors: new Set(data.map(d => d.studentId)).size
    };
  }

  return { getDataset, uploadObservation, getStats };
})();

if (typeof window !== 'undefined') {
  window.BioLabCitizen = BioLabCitizen;
}
