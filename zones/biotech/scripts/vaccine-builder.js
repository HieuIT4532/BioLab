/* ============================================================
   BioLab — Vaccine Builder Simulation
   Immune response modeling, vaccine efficacy comparison
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const Engine = window.BioLabEngine;
  let immuneChart = null;
  let simulationData = [];

  const PATHOGENS = {
    sars_cov2: { name: 'SARS-CoV-2', load: 1000, desc: 'Coronavirus gây COVID-19. Protein spike (S) là mục tiêu chính của vaccine.' },
    influenza: { name: 'Influenza', load: 800, desc: 'Virus cúm type A/B. Kháng nguyên HA và NA thay đổi theo mùa.' },
    hpv: { name: 'HPV', load: 500, desc: 'Human Papillomavirus. Gây u nhú và ung thư cổ tử cung.' },
    rabies: { name: 'Rabies', load: 1200, desc: 'Virus dại. Gây viêm não tử vong nếu không điều trị kịp thời.' }
  };

  const VACCINE_TYPES = {
    mRNA: { efficacy: 0.93, responseDelay: 6, antibodyMultiplier: 2.0, name: 'mRNA' },
    inactivated: { efficacy: 0.75, responseDelay: 24, antibodyMultiplier: 1.0, name: 'Bất hoạt' },
    attenuated: { efficacy: 0.90, responseDelay: 12, antibodyMultiplier: 1.8, name: 'Giảm độc lực' },
    subunit: { efficacy: 0.85, responseDelay: 18, antibodyMultiplier: 1.4, name: 'Tiểu đơn vị' }
  };

  // Show pathogen info
  const pathogenSelect = document.getElementById('pathogenSelect');
  const pathogenInfo = document.getElementById('pathogenInfo');
  updatePathogenInfo();
  pathogenSelect.addEventListener('change', updatePathogenInfo);

  function updatePathogenInfo() {
    const p = PATHOGENS[pathogenSelect.value];
    pathogenInfo.innerHTML = `<strong>${p.name}</strong>: ${p.desc}`;
  }

  // Vaccine type selection
  document.querySelectorAll('input[name="vaccineType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('#vaccineTypes .symptom-item').forEach(item => {
        item.classList.toggle('checked', item.querySelector('input').checked);
      });
    });
  });

  // Simulate
  document.getElementById('btnSimulate').addEventListener('click', () => {
    const pathogen = PATHOGENS[pathogenSelect.value];
    const vaccineRadio = document.querySelector('input[name="vaccineType"]:checked');
    if (!vaccineRadio) {
      alert('Vui lòng chọn phương pháp vaccine!');
      return;
    }
    const vaccine = VACCINE_TYPES[vaccineRadio.value];
    runSimulation(pathogen, vaccine, true);
  });

  // Compare all
  document.getElementById('btnCompare').addEventListener('click', () => {
    const pathogen = PATHOGENS[pathogenSelect.value];
    compareAllVaccines(pathogen);
  });

  // Export
  document.getElementById('btnExport').addEventListener('click', () => {
    if (simulationData.length > 0 && Engine) {
      Engine.DataCollector.exportCSV(simulationData, 'vaccine_simulation.csv');
      if (window.BioLabData) {
        BioLabData.Profile.addXP(10, 'Xuất dữ liệu vaccine');
      }
    }
  });

  function runSimulation(pathogen, vaccine, updateUI = true) {
    const data = [];
    let pathogenLoad = pathogen.load;
    let antibodies = 50; // Pre-vaccinated baseline
    let tcells = 20;
    const hours = 168; // 7 days

    for (let t = 0; t <= hours; t += 2) {
      if (t >= vaccine.responseDelay) {
        const elapsed = t - vaccine.responseDelay;
        antibodies += (pathogenLoad * 0.08 + 5) * vaccine.antibodyMultiplier * (1 + elapsed * 0.005);
        tcells += pathogenLoad * 0.04 + 2 * vaccine.antibodyMultiplier;
      }

      const noise = Engine ? Engine.Noise.gaussian(0, pathogenLoad * 0.02) : 0;
      const killing = (antibodies * 0.02 + tcells * 0.05);
      pathogenLoad = Math.max(0, pathogenLoad * 1.08 - killing + noise);

      data.push({
        time: t,
        pathogen: Math.round(pathogenLoad),
        antibodies: Math.round(antibodies),
        tcells: Math.round(tcells)
      });

      if (pathogenLoad < 1) {
        // Fill remaining with zeros
        for (let r = t + 2; r <= hours; r += 2) {
          data.push({ time: r, pathogen: 0, antibodies: Math.round(antibodies), tcells: Math.round(tcells) });
        }
        break;
      }
    }

    simulationData = data;

    if (updateUI) {
      renderChart(data, vaccine.name);
      updateResults(data, vaccine);
    }

    // Track
    if (window.BioLabData) {
      BioLabData.Profile.addXP(20, `Mô phỏng vaccine ${vaccine.name}`);
      BioLabData.Profile.incrementExperiments();
      BioLabData.Profile.updateZoneProgress('biotech', 'vaccine', 75);
      BioLabData.Profile.updateCompetency('scientificThinking', 65);
      BioLabData.Analytics.track({ type: 'experiment_run', module: 'vaccine', vaccine: vaccine.name });
    }

    return data;
  }

  function compareAllVaccines(pathogen) {
    const datasets = [];
    const colors = ['#00D4AA', '#7C4DFF', '#FF4081', '#00BCD4'];
    let i = 0;
    for (const [key, vaccine] of Object.entries(VACCINE_TYPES)) {
      const data = [];
      let pLoad = pathogen.load;
      let ab = 50;
      let tc = 20;
      for (let t = 0; t <= 168; t += 2) {
        if (t >= vaccine.responseDelay) {
          ab += (pLoad * 0.08 + 5) * vaccine.antibodyMultiplier * (1 + (t - vaccine.responseDelay) * 0.005);
          tc += pLoad * 0.04 + 2 * vaccine.antibodyMultiplier;
        }
        const killing = ab * 0.02 + tc * 0.05;
        pLoad = Math.max(0, pLoad * 1.08 - killing);
        data.push({ time: t, antibodies: Math.round(ab) });
        if (pLoad < 1) break;
      }
      datasets.push({
        label: vaccine.name,
        data: data.map(d => ({ x: d.time, y: d.antibodies })),
        borderColor: colors[i],
        backgroundColor: colors[i] + '20',
        fill: false,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0
      });
      i++;
    }

    if (immuneChart) immuneChart.destroy();
    const ctx = document.getElementById('immuneChart').getContext('2d');
    immuneChart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: getChartOptions('Thời gian (giờ)', 'Kháng thể')
    });
  }

  function renderChart(data, vaccineName) {
    if (immuneChart) immuneChart.destroy();
    const ctx = document.getElementById('immuneChart').getContext('2d');
    immuneChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.time + 'h'),
        datasets: [
          {
            label: 'Pathogen',
            data: data.map(d => d.pathogen),
            borderColor: '#FF5252',
            backgroundColor: 'rgba(255,82,82,0.1)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
          },
          {
            label: 'Kháng thể',
            data: data.map(d => d.antibodies),
            borderColor: '#00D4AA',
            backgroundColor: 'rgba(0,212,170,0.1)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
          },
          {
            label: 'T Cells',
            data: data.map(d => d.tcells),
            borderColor: '#7C4DFF',
            backgroundColor: 'rgba(124,77,255,0.1)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
          }
        ]
      },
      options: getChartOptions('Thời gian', 'Số lượng')
    });
  }

  function getChartOptions(xLabel, yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#8892B0', font: { family: 'Inter' } } }
      },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: '#8892B0' },
          ticks: { color: '#5A6380', maxTicksLimit: 12 },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          title: { display: true, text: yLabel, color: '#8892B0' },
          ticks: { color: '#5A6380' },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    };
  }

  function updateResults(data, vaccine) {
    const peakAb = Math.max(...data.map(d => d.antibodies));
    const clearTime = data.find(d => d.pathogen < 1);
    const efficacy = Math.round(vaccine.efficacy * 100);

    document.getElementById('efficacy').textContent = efficacy + '%';
    document.getElementById('responseTime').textContent = vaccine.responseDelay + 'h';
    document.getElementById('peakAntibody').textContent = peakAb.toLocaleString();
  }

  // Track visit
  if (window.BioLabData) {
    BioLabData.Analytics.track({ type: 'module_visit', module: 'vaccine_builder' });
  }
});
