/* ============================================================
   BioLab — Photosynthesis Simulator
   Light response curves for C3, C4, CAM plants
   ============================================================ */

(function () {
  const PLANTS = {
    c3: {
      name: 'C3 (Lúa)',
      maxRate: 25, // μmol CO₂/m²/s
      lightSaturation: 800,  // light saturation point
      compensationPoint: 50, // light compensation point
      optTemp: 25,
      tempRange: 12,
      co2Sensitivity: 1.0,
      color: '#4CAF50',
    },
    c4: {
      name: 'C4 (Ngô)',
      maxRate: 40,
      lightSaturation: 1500,
      compensationPoint: 20,
      optTemp: 35,
      tempRange: 15,
      co2Sensitivity: 0.6, // less sensitive to CO₂ (already concentrating)
      color: '#FFD740',
    },
    cam: {
      name: 'CAM (Xương rồng)',
      maxRate: 15,
      lightSaturation: 600,
      compensationPoint: 30,
      optTemp: 30,
      tempRange: 18,
      co2Sensitivity: 0.8,
      color: '#E040FB',
    }
  };

  let chart = null;
  let experimentData = [];
  let experimentCount = 0;

  function calcPhotosynthesisRate(light, co2, temp, plantType) {
    const p = PLANTS[plantType];

    // Light response (rectangular hyperbola)
    const lightFactor = light / (light + p.lightSaturation * 0.3);

    // CO₂ effect (Michaelis-like)
    const co2Factor = co2 / (co2 + 200 * p.co2Sensitivity);

    // Temperature effect (bell curve)
    const tempDiff = Math.abs(temp - p.optTemp);
    const tempFactor = Math.exp(-0.5 * Math.pow(tempDiff / p.tempRange, 2));
    const heatStress = temp > p.optTemp + 10 ? Math.max(0, 1 - (temp - p.optTemp - 10) / 15) : 1;

    // Dark respiration (always occurring)
    const respiration = 2.0;

    // Net photosynthesis
    const grossRate = p.maxRate * lightFactor * co2Factor * tempFactor * heatStress;
    const netRate = grossRate - respiration;

    // Noise ±3%
    const noise = netRate * (Math.random() * 0.06 - 0.03);

    return Math.max(-respiration, netRate + noise);
  }

  function generateLightCurve(plantType, co2, temp) {
    const points = [];
    for (let light = 0; light <= 2000; light += 25) {
      const rate = calcPhotosynthesisRate(light, co2, temp, plantType);
      points.push({ light, rate });
    }
    return points;
  }

  function initChart() {
    const ctx = document.getElementById('photoChart')?.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Cường độ ánh sáng (μmol/m²/s)', color: '#8892B0' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8892B0' },
          },
          y: {
            title: { display: true, text: 'Tốc độ quang hợp ròng (μmol CO₂/m²/s)', color: '#8892B0' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8892B0' },
          }
        },
        plugins: {
          legend: { labels: { color: '#E2E8F0', usePointStyle: true } },
          tooltip: {
            backgroundColor: 'rgba(10, 14, 39, 0.9)',
            borderColor: 'rgba(0, 212, 170, 0.3)',
            borderWidth: 1,
          },
          // Zero line annotation
        }
      }
    });
  }

  function addCurveToChart(curveData, label, color) {
    chart.data.datasets.push({
      label,
      data: curveData.map(p => ({ x: p.light, y: p.rate })),
      borderColor: color,
      backgroundColor: color + '15',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
    });
    chart.update();
  }

  function setupUI() {
    const lightSlider = document.getElementById('lightSlider');
    const co2Slider = document.getElementById('co2Slider');
    const tempSlider = document.getElementById('photoTempSlider');
    const plantSelect = document.getElementById('plantSelect');

    function updateDisplays() {
      const light = parseFloat(lightSlider.value);
      const co2 = parseFloat(co2Slider.value);
      const temp = parseFloat(tempSlider.value);
      const plant = plantSelect.value;

      document.getElementById('lightValue').textContent = light;
      document.getElementById('co2Value').textContent = co2;
      document.getElementById('photoTempValue').textContent = temp;

      const rate = calcPhotosynthesisRate(light, co2, temp, plant);
      document.getElementById('photoRateDisplay').textContent = rate.toFixed(2);

      // Find compensation point
      const p = PLANTS[plant];
      document.getElementById('compPointDisplay').textContent = p.compensationPoint;
    }

    lightSlider.addEventListener('input', updateDisplays);
    co2Slider.addEventListener('input', updateDisplays);
    tempSlider.addEventListener('input', updateDisplays);
    plantSelect.addEventListener('change', updateDisplays);

    document.getElementById('runPhoto').addEventListener('click', () => {
      const co2 = parseFloat(co2Slider.value);
      const temp = parseFloat(tempSlider.value);
      const plant = plantSelect.value;
      const p = PLANTS[plant];

      const curve = generateLightCurve(plant, co2, temp);
      const label = `${p.name} CO₂=${co2}ppm T=${temp}°C`;
      addCurveToChart(curve, label, p.color);

      // Data table
      const light = parseFloat(lightSlider.value);
      const rate = calcPhotosynthesisRate(light, co2, temp, plant);
      experimentCount++;

      const row = { id: experimentCount, light, co2, temp, rate: rate.toFixed(2), plant: p.name };
      experimentData.push(row);

      const tbody = document.getElementById('photoDataBody');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.id}</td><td>${row.light}</td><td>${row.co2}</td><td>${row.temp}</td><td>${row.rate}</td><td>${row.plant}</td>`;
      tbody.appendChild(tr);
    });

    document.getElementById('exportPhotoCSV').addEventListener('click', () => {
      if (experimentData.length === 0) { alert('Chưa có dữ liệu!'); return; }
      let csv = 'STT,Ánh sáng (μmol/m²/s),CO₂ (ppm),Nhiệt độ (°C),Tốc độ QH (μmol CO₂/m²/s),Loại cây\n';
      experimentData.forEach(d => { csv += `${d.id},${d.light},${d.co2},${d.temp},${d.rate},${d.plant}\n`; });
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `BioLab_Photosynthesis_${Date.now()}.csv`;
      a.click();
    });

    document.getElementById('resetPhoto').addEventListener('click', () => {
      experimentData = [];
      experimentCount = 0;
      document.getElementById('photoDataBody').innerHTML = '';
      if (chart) { chart.data.datasets = []; chart.update(); }
    });

    updateDisplays();
  }

  function waitAndInit() {
    if (typeof Chart !== 'undefined') { initChart(); setupUI(); }
    else { setTimeout(waitAndInit, 100); }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', waitAndInit)
    : waitAndInit();
})();
