/* ============================================================
   BioLab X — Interdisciplinary Integration (Liên môn)
   Sinh + Toán, Sinh + Tin (AI Vision), Sinh + Địa (Ecology Maps)
   ============================================================ */

const BioLabInterdisciplinary = (() => {

  // ══════════════════════════════════════════════
  // SINH + TOÁN (Statistical Analysis)
  // ══════════════════════════════════════════════
  const MathTools = {
    mean(arr) {
      if (!arr || arr.length === 0) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    },

    standardDeviation(arr) {
      if (!arr || arr.length === 0) return 0;
      const m = this.mean(arr);
      const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
      return Math.sqrt(variance);
    },

    // Simple linear regression: y = mx + b
    linearRegression(xArr, yArr) {
      if (!xArr || !yArr || xArr.length !== yArr.length || xArr.length === 0) return null;
      const n = xArr.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      for (let i = 0; i < n; i++) {
        sumX += xArr[i];
        sumY += yArr[i];
        sumXY += xArr[i] * yArr[i];
        sumXX += xArr[i] * xArr[i];
      }

      const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const b = (sumY - m * sumX) / n;
      
      // Calculate R-squared
      const yMean = sumY / n;
      let ssTot = 0, ssRes = 0;
      for (let i = 0; i < n; i++) {
        const yPred = m * xArr[i] + b;
        ssTot += Math.pow(yArr[i] - yMean, 2);
        ssRes += Math.pow(yArr[i] - yPred, 2);
      }
      const rSquared = 1 - (ssRes / ssTot);

      return { slope: m, intercept: b, rSquared };
    },

    tTestMock(arr1, arr2) {
      // Mocked t-test for educational purposes
      const m1 = this.mean(arr1);
      const m2 = this.mean(arr2);
      const diff = Math.abs(m1 - m2);
      const sd1 = this.standardDeviation(arr1);
      const sd2 = this.standardDeviation(arr2);
      
      const isSignificant = diff > (sd1 + sd2) / 2;
      return {
        mean1: m1, mean2: m2,
        difference: diff,
        pValue: isSignificant ? 0.04 : 0.15, // mock p-value
        significant: isSignificant
      };
    }
  };

  // ══════════════════════════════════════════════
  // SINH + TIN (AI Computer Vision Simulator)
  // ══════════════════════════════════════════════
  const AIVision = {
    // Simulates an AI model analyzing a biological image
    analyzeImage(imageFileOrUrl, type = 'cell') {
      return new Promise((resolve) => {
        setTimeout(() => {
          let result = {};
          if (type === 'cell') {
            result = {
              classification: 'Tế bào thực vật',
              confidence: 0.94,
              features: [
                { name: 'Vách tế bào', conf: 0.98, box: [10, 10, 90, 90] },
                { name: 'Lục lạp', conf: 0.85, box: [30, 30, 20, 20] },
                { name: 'Không bào lớn', conf: 0.91, box: [40, 50, 40, 30] }
              ],
              suggestion: 'Tế bào này có khả năng quang hợp do phát hiện lục lạp.'
            };
          } else if (type === 'leaf') {
            result = {
              classification: 'Lá cây hai lá mầm (Dicot)',
              confidence: 0.88,
              features: [
                { name: 'Gân hình mạng', conf: 0.92, box: [20, 20, 60, 60] },
                { name: 'Mép lá răng cưa', conf: 0.81, box: [5, 5, 95, 95] }
              ],
              disease: { detected: true, name: 'Đốm lá (Leaf Spot)', conf: 0.75 }
            };
          } else {
            result = { classification: 'Unknown', confidence: 0.1, features: [] };
          }
          resolve(result);
        }, 1500); // simulate network delay
      });
    }
  };

  // ══════════════════════════════════════════════
  // SINH + ĐỊA (Ecological Mapping)
  // ══════════════════════════════════════════════
  const EcoGeography = {
    // Generate mock biodiversity heatmap data based on region
    generateHeatmapData(regionStr) {
      const data = [];
      const baseLat = 16.0; // Central Vietnam roughly
      const baseLng = 108.0;
      
      for(let i=0; i<50; i++) {
        data.push({
          lat: baseLat + (Math.random() - 0.5) * 10,
          lng: baseLng + (Math.random() - 0.5) * 5,
          weight: Math.random(),
          species: ['Phượng vĩ', 'Bàng', 'Sao đen', 'Lim xẹt'][Math.floor(Math.random()*4)]
        });
      }
      return data;
    },

    calculateBiodiversityIndex(speciesCounts) {
      // Shannon-Wiener Index (H')
      // speciesCounts: array of integers representing counts of each species
      const total = speciesCounts.reduce((a, b) => a + b, 0);
      if (total === 0) return 0;

      let h = 0;
      speciesCounts.forEach(count => {
        if (count > 0) {
          const p = count / total;
          h -= p * Math.log(p);
        }
      });
      return h; // Typically between 1.5 and 3.5
    }
  };

  return { MathTools, AIVision, EcoGeography };
})();

if (typeof window !== 'undefined') {
  window.BioLabInterdisciplinary = BioLabInterdisciplinary;
}
