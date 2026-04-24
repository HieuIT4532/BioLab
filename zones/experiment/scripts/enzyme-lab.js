/* ============================================================
   BioVerse — Enzyme Kinetics Simulator
   Michaelis-Menten model with temperature/pH effects
   ============================================================ */

(function () {
  // ── Enzyme Parameters ──
  const ENZYMES = {
    amylase: { name: 'Amylase', Vmax: 12.0, Km: 3.5, optTemp: 37, optpH: 7.0, tempRange: 15, pHRange: 2.5 },
    pepsin:  { name: 'Pepsin',  Vmax: 15.0, Km: 2.0, optTemp: 37, optpH: 2.0, tempRange: 12, pHRange: 1.5 },
    catalase:{ name: 'Catalase',Vmax: 20.0, Km: 5.0, optTemp: 30, optpH: 7.0, tempRange: 20, pHRange: 3.0 },
  };

  let chart = null;
  let experimentData = [];
  let experimentCount = 0;

  // ── Michaelis-Menten with environment effects ──
  function calcV0(S, enzyme, temp, pH) {
    const e = ENZYMES[enzyme];

    // Temperature effect (bell curve)
    const tempDiff = Math.abs(temp - e.optTemp);
    const tempFactor = Math.exp(-0.5 * Math.pow(tempDiff / e.tempRange, 2));
    // Denaturation above optimal
    const denaturation = temp > e.optTemp + 10 ? Math.max(0, 1 - (temp - e.optTemp - 10) / 20) : 1;

    // pH effect (bell curve)
    const pHDiff = Math.abs(pH - e.optpH);
    const pHFactor = Math.exp(-0.5 * Math.pow(pHDiff / e.pHRange, 2));

    // Effective Vmax and Km
    const effectiveVmax = e.Vmax * tempFactor * denaturation * pHFactor;
    const effectiveKm = e.Km * (1 + 0.1 * tempDiff) * (1 + 0.15 * pHDiff);

    // Michaelis-Menten: V = Vmax * [S] / (Km + [S])
    const V0 = effectiveVmax * S / (effectiveKm + S);

    // Add realistic noise (±5%)
    const noise = V0 * (Math.random() * 0.10 - 0.05);

    return {
      V0: Math.max(0, V0 + noise),
      Vmax: effectiveVmax,
      Km: effectiveKm,
    };
  }

  // ── Generate full Michaelis-Menten curve ──
  function generateCurve(enzyme, temp, pH) {
    const points = [];
    for (let s = 0; s <= 20; s += 0.5) {
      const result = calcV0(s, enzyme, temp, pH);
      points.push({ S: s, V0: result.V0 });
    }
    return points;
  }

  // ── Chart ──
  function initChart() {
    const ctx = document.getElementById('enzymeChart')?.getContext('2d');
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: '[S] Nồng độ cơ chất (mM)', color: '#8892B0', font: { family: 'Inter' } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8892B0' },
          },
          y: {
            title: { display: true, text: 'V₀ Vận tốc phản ứng (mM/s)', color: '#8892B0', font: { family: 'Inter' } },
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8892B0' },
            min: 0,
          }
        },
        plugins: {
          legend: {
            labels: { color: '#E2E8F0', usePointStyle: true, font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            backgroundColor: 'rgba(10, 14, 39, 0.9)',
            borderColor: 'rgba(0, 212, 170, 0.3)',
            borderWidth: 1,
            titleFont: { family: 'Outfit' },
            bodyFont: { family: 'Inter' },
          }
        }
      }
    });
  }

  function addCurveToChart(curveData, label, colorIdx) {
    const colors = [
      { border: '#00D4AA', bg: 'rgba(0, 212, 170, 0.1)' },
      { border: '#7C4DFF', bg: 'rgba(124, 77, 255, 0.1)' },
      { border: '#E040FB', bg: 'rgba(224, 64, 251, 0.1)' },
      { border: '#FFD740', bg: 'rgba(255, 215, 64, 0.1)' },
      { border: '#40C4FF', bg: 'rgba(64, 196, 255, 0.1)' },
    ];
    const c = colors[colorIdx % colors.length];

    chart.data.datasets.push({
      label: label,
      data: curveData.map(p => ({ x: p.S, y: p.V0 })),
      borderColor: c.border,
      backgroundColor: c.bg,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 1,
      pointHoverRadius: 5,
    });

    chart.update();
  }

  // ── UI Logic ──
  function setupUI() {
    const tempSlider = document.getElementById('tempSlider');
    const phSlider = document.getElementById('phSlider');
    const substrateSlider = document.getElementById('substrateSlider');
    const enzymeSelect = document.getElementById('enzymeSelect');

    // Live update displays
    function updateDisplays() {
      const temp = parseFloat(tempSlider.value);
      const pH = parseFloat(phSlider.value);
      const S = parseFloat(substrateSlider.value);
      const enzyme = enzymeSelect.value;

      document.getElementById('tempValue').textContent = temp;
      document.getElementById('phValue').textContent = pH.toFixed(1);
      document.getElementById('substrateValue').textContent = S.toFixed(1);

      const result = calcV0(S, enzyme, temp, pH);
      document.getElementById('v0Display').textContent = result.V0.toFixed(2);
      document.getElementById('vmaxDisplay').textContent = result.Vmax.toFixed(2);
      document.getElementById('kmDisplay').textContent = result.Km.toFixed(2);
    }

    tempSlider.addEventListener('input', updateDisplays);
    phSlider.addEventListener('input', updateDisplays);
    substrateSlider.addEventListener('input', updateDisplays);
    enzymeSelect.addEventListener('change', updateDisplays);

    // Run Experiment
    document.getElementById('runExperiment').addEventListener('click', () => {
      const temp = parseFloat(tempSlider.value);
      const pH = parseFloat(phSlider.value);
      const enzyme = enzymeSelect.value;
      const enzymeName = ENZYMES[enzyme].name;

      const curve = generateCurve(enzyme, temp, pH);
      const label = `${enzymeName} T=${temp}°C pH=${pH}`;
      addCurveToChart(curve, label, experimentCount);

      // Add to data table
      const S = parseFloat(substrateSlider.value);
      const result = calcV0(S, enzyme, temp, pH);
      experimentCount++;

      const row = {
        id: experimentCount,
        S: S.toFixed(1),
        V0: result.V0.toFixed(3),
        temp: temp,
        pH: pH.toFixed(1),
        enzyme: enzymeName,
      };
      experimentData.push(row);

      const tbody = document.getElementById('dataBody');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.id}</td><td>${row.S}</td><td>${row.V0}</td><td>${row.temp}</td><td>${row.pH}</td><td>${row.enzyme}</td>`;
      tbody.appendChild(tr);
    });

    // Export CSV
    document.getElementById('exportCSV').addEventListener('click', () => {
      if (experimentData.length === 0) {
        alert('Chưa có dữ liệu! Hãy chạy thí nghiệm trước.');
        return;
      }

      let csv = 'STT,[S] (mM),V0 (mM/s),Nhiệt độ (°C),pH,Enzyme\n';
      experimentData.forEach(d => {
        csv += `${d.id},${d.S},${d.V0},${d.temp},${d.pH},${d.enzyme}\n`;
      });

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BioVerse_Enzyme_Experiment_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Reset
    document.getElementById('resetLab').addEventListener('click', () => {
      experimentData = [];
      experimentCount = 0;
      document.getElementById('dataBody').innerHTML = '';
      if (chart) {
        chart.data.datasets = [];
        chart.update();
      }
    });

    // Initial display
    updateDisplays();
  }

  // Initialize
  function waitAndInit() {
    if (typeof Chart !== 'undefined') {
      initChart();
      setupUI();
    } else {
      setTimeout(waitAndInit, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    waitAndInit();
  }
})();
