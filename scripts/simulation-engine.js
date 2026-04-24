/* ============================================================
   BioLab — Simulation Engine Core
   Central brain for all zone simulations
   Modules: BiologyRules, PhysicsEngine, NoiseGenerator, DataCollector
   ============================================================ */

const BioLabEngine = (() => {

  // ══════════════════════════════════════════════
  // 1. PHYSICS ENGINE
  // ══════════════════════════════════════════════
  const Physics = {
    // Temperature effect on reaction rate (Arrhenius-inspired)
    temperatureEffect(temp, optimalTemp = 37, activationEnergy = 50) {
      const T = temp + 273.15;
      const Topt = optimalTemp + 273.15;
      const R = 8.314;
      const factor = Math.exp(-activationEnergy * 1000 * Math.abs(1/T - 1/Topt) / R);
      // Denaturation above optimal
      if (temp > optimalTemp + 10) {
        const denaturation = Math.exp(-0.1 * (temp - optimalTemp - 10));
        return factor * denaturation;
      }
      return Math.min(factor, 1.0);
    },

    // pH effect (bell curve around optimum)
    pHEffect(pH, optimalPH = 7.0, width = 2.0) {
      return Math.exp(-Math.pow(pH - optimalPH, 2) / (2 * width * width));
    },

    // Diffusion rate (simplified Fick's law)
    diffusionRate(concentration, distance, diffCoeff = 1e-9) {
      return diffCoeff * concentration / distance;
    },

    // Light absorption (Beer-Lambert)
    lightAbsorption(intensity, absorbance, pathLength = 1) {
      return intensity * Math.pow(10, -absorbance * pathLength);
    },

    // Osmotic pressure
    osmoticPressure(concentration, temp = 25) {
      const R = 8.314;
      const T = temp + 273.15;
      return concentration * R * T; // π = CRT
    }
  };

  // ══════════════════════════════════════════════
  // 2. BIOLOGY RULES ENGINE
  // ══════════════════════════════════════════════
  const Biology = {
    // ── Enzyme Kinetics (Michaelis-Menten) ──
    enzymes: {
      amylase:  { Vmax: 12.0, Km: 3.5, optimalTemp: 37, optimalPH: 7.0, name: 'Amylase' },
      pepsin:   { Vmax: 8.0,  Km: 2.0, optimalTemp: 37, optimalPH: 2.0, name: 'Pepsin' },
      catalase: { Vmax: 18.0, Km: 5.0, optimalTemp: 37, optimalPH: 7.0, name: 'Catalase' },
      lipase:   { Vmax: 10.0, Km: 4.0, optimalTemp: 37, optimalPH: 8.0, name: 'Lipase' },
      trypsin:  { Vmax: 9.0,  Km: 3.0, optimalTemp: 37, optimalPH: 8.0, name: 'Trypsin' }
    },

    michaelisMenten(S, Vmax, Km) {
      return (Vmax * S) / (Km + S);
    },

    enzymeReaction(enzyme, substrate, temp, pH) {
      const e = this.enzymes[enzyme];
      if (!e) return { v0: 0, Vmax: 0, Km: 0 };
      const tempFactor = Physics.temperatureEffect(temp, e.optimalTemp);
      const phFactor = Physics.pHEffect(pH, e.optimalPH);
      const effectiveVmax = e.Vmax * tempFactor * phFactor;
      const v0 = this.michaelisMenten(substrate, effectiveVmax, e.Km);
      return { v0, Vmax: effectiveVmax, Km: e.Km, tempFactor, phFactor };
    },

    // ── Photosynthesis Models ──
    photosynthesis: {
      C3: { maxRate: 25, lightSat: 800, co2Comp: 50, optTemp: 25, name: 'C3' },
      C4: { maxRate: 40, lightSat: 1200, co2Comp: 10, optTemp: 35, name: 'C4' },
      CAM: { maxRate: 15, lightSat: 600, co2Comp: 30, optTemp: 30, name: 'CAM' }
    },

    photosynthesisRate(type, lightIntensity, co2, temp) {
      const p = this.photosynthesis[type];
      if (!p) return 0;
      const lightFactor = 1 - Math.exp(-lightIntensity / p.lightSat * 3);
      const co2Factor = co2 / (co2 + p.co2Comp);
      const tempFactor = Physics.temperatureEffect(temp, p.optTemp, 40);
      return p.maxRate * lightFactor * co2Factor * tempFactor;
    },

    // ── Genetics ──
    mendelianCross(parent1, parent2) {
      // parent format: "Aa" or "AA" or "aa"
      const alleles1 = parent1.split('');
      const alleles2 = parent2.split('');
      const offspring = [];
      for (const a1 of alleles1) {
        for (const a2 of alleles2) {
          const sorted = [a1, a2].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b));
          offspring.push(sorted.join(''));
        }
      }
      return offspring;
    },

    punnettSquare(parent1Alleles, parent2Alleles) {
      // Multi-gene: parent1Alleles = [{gene: 'A', alleles: ['A','a']}, ...]
      const grid = [];
      for (const a1 of parent1Alleles) {
        for (const a2 of parent2Alleles) {
          grid.push({ gamete1: a1, gamete2: a2, genotype: a1 + a2 });
        }
      }
      return grid;
    },

    // ── Population Ecology (Logistic Growth) ──
    logisticGrowth(N, r, K) {
      return r * N * (1 - N / K);
    },

    populationModel(N0, r, K, generations) {
      const data = [{ gen: 0, N: N0 }];
      let N = N0;
      for (let i = 1; i <= generations; i++) {
        const dN = this.logisticGrowth(N, r, K);
        N = Math.max(0, N + dN);
        data.push({ gen: i, N: Math.round(N) });
      }
      return data;
    },

    // ── CRISPR Simulation ──
    crispr: {
      findPAM(sequence) {
        const pamPattern = /[ATCG]GG/gi;
        const sites = [];
        let match;
        while ((match = pamPattern.exec(sequence)) !== null) {
          sites.push({ position: match.index, sequence: match[0] });
        }
        return sites;
      },

      cutDNA(sequence, cutPosition) {
        const before = sequence.substring(0, cutPosition);
        const after = sequence.substring(cutPosition);
        return { before, after, cutSite: cutPosition };
      },

      insertSequence(dna, position, insertion) {
        return dna.before + insertion + dna.after;
      }
    },

    // ── Immune Response Model ──
    immuneResponse(pathogenLoad, timeHours, vaccinated = false) {
      const data = [];
      let pathogen = pathogenLoad;
      let antibodies = vaccinated ? 50 : 0;
      let tcells = vaccinated ? 20 : 0;
      const responseDelay = vaccinated ? 2 : 48; // hours

      for (let t = 0; t <= timeHours; t += 1) {
        if (t >= responseDelay) {
          antibodies += (pathogen * 0.1 + (vaccinated ? 5 : 1)) * (1 + t * 0.01);
          tcells += pathogen * 0.05 + (vaccinated ? 2 : 0.5);
        }
        const killing = (antibodies * 0.02 + tcells * 0.05);
        pathogen = Math.max(0, pathogen * 1.1 - killing);
        data.push({
          time: t,
          pathogen: Math.round(pathogen),
          antibodies: Math.round(antibodies),
          tcells: Math.round(tcells)
        });
        if (pathogen < 1) break;
      }
      return data;
    }
  };

  // ══════════════════════════════════════════════
  // 3. NOISE GENERATOR (Realistic Error)
  // ══════════════════════════════════════════════
  const Noise = {
    // Gaussian noise
    gaussian(mean = 0, stddev = 1) {
      let u1 = Math.random();
      let u2 = Math.random();
      while (u1 === 0) u1 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z * stddev + mean;
    },

    // Add realistic noise to a measurement
    addNoise(value, noisePercent = 5) {
      const noise = this.gaussian(0, value * noisePercent / 100);
      return Math.max(0, value + noise);
    },

    // Systematic error (instrument bias)
    systematicError(value, biasPercent = 2) {
      return value * (1 + biasPercent / 100);
    },

    // Add noise to an array of data
    addNoiseToArray(data, noisePercent = 5) {
      return data.map(v => this.addNoise(v, noisePercent));
    }
  };

  // ══════════════════════════════════════════════
  // 4. DATA COLLECTOR
  // ══════════════════════════════════════════════
  const DataCollector = {
    experiments: [],

    record(experimentData) {
      const entry = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        timestamp: new Date().toISOString(),
        ...experimentData
      };
      this.experiments.push(entry);
      // Persist to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('bioverse_experiments') || '[]');
        stored.push(entry);
        localStorage.setItem('bioverse_experiments', JSON.stringify(stored));
      } catch (e) { /* silent fail */ }
      return entry;
    },

    getAll() {
      try {
        return JSON.parse(localStorage.getItem('bioverse_experiments') || '[]');
      } catch (e) { return []; }
    },

    exportCSV(data, filename = 'bioverse_data.csv') {
      if (!data || data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h];
          return typeof val === 'string' ? `"${val}"` : val;
        }).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    exportJSON(data, filename = 'bioverse_data.json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    clear() {
      this.experiments = [];
      localStorage.removeItem('bioverse_experiments');
    }
  };

  // Public API
  return {
    Physics,
    Biology,
    Noise,
    DataCollector,
    version: '1.0.0'
  };

})();

// Make globally available
if (typeof window !== 'undefined') {
  window.BioLabEngine = BioLabEngine;
}
