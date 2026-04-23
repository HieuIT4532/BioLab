document.addEventListener('DOMContentLoaded', () => {
    // Enzyme Simulation
    const enzymeCtx = document.getElementById('enzymeChart').getContext('2d');
    let enzymeChart;

    const tempSlider = document.getElementById('temp-slider');
    const phSlider = document.getElementById('ph-slider');
    const subSlider = document.getElementById('substrate-slider');
    const enzymeType = document.getElementById('enzyme-type');

    const tempVal = document.getElementById('temp-val');
    const phVal = document.getElementById('ph-val');
    const subVal = document.getElementById('substrate-val');

    const enzymeData = {
        amylase: { optTemp: 37, optPH: 7.0, Vmax: 100, Km: 5 },
        pepsin: { optTemp: 37, optPH: 2.0, Vmax: 80, Km: 3 },
        catalase: { optTemp: 25, optPH: 7.0, Vmax: 150, Km: 10 }
    };

    const updateEnzymeLabels = () => {
        tempVal.textContent = tempSlider.value + '°C';
        phVal.textContent = phSlider.value;
        subVal.textContent = subSlider.value + ' mM';
    };

    const calculateEnzymeRate = () => {
        const type = enzymeType.value;
        const config = enzymeData[type];
        const T = parseFloat(tempSlider.value);
        const pH = parseFloat(phSlider.value);
        const S = parseFloat(subSlider.value);

        // Factors for Temp and pH (Gaussian-ish)
        const tempFactor = Math.exp(-Math.pow(T - config.optTemp, 2) / 400);
        const phFactor = Math.exp(-Math.pow(pH - config.optPH, 2) / 2);
        
        const effectiveVmax = config.Vmax * tempFactor * phFactor;
        
        // Michaelis-Menten: v = (Vmax * [S]) / (Km + [S])
        const rate = (effectiveVmax * S) / (config.Km + S);
        return { rate, efficiency: (tempFactor * phFactor * 100).toFixed(0) };
    };

    const runEnzymeSim = () => {
        const { rate, efficiency } = calculateEnzymeRate();
        document.getElementById('velocity-val').textContent = rate.toFixed(2) + ' μM/s';
        document.getElementById('efficiency-val').textContent = efficiency + '%';

        // Draw curve for [S] vs Velocity
        const labels = [];
        const data = [];
        const config = enzymeData[enzymeType.value];
        const T = parseFloat(tempSlider.value);
        const pH = parseFloat(phSlider.value);
        const tempFactor = Math.exp(-Math.pow(T - config.optTemp, 2) / 400);
        const phFactor = Math.exp(-Math.pow(pH - config.optPH, 2) / 2);
        const eVmax = config.Vmax * tempFactor * phFactor;

        for (let s = 0; s <= 20; s += 1) {
            labels.push(s);
            data.push(((eVmax * s) / (config.Km + s)).toFixed(2));
        }

        if (enzymeChart) enzymeChart.destroy();
        enzymeChart = new Chart(enzymeCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vận tốc phản ứng',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { title: { display: true, text: 'Nồng độ cơ chất [S]', color: '#94a3b8' } }
                }
            }
        });
    };

    [tempSlider, phSlider, subSlider, enzymeType].forEach(el => {
        el.addEventListener('input', () => { updateEnzymeLabels(); runEnzymeSim(); });
    });

    runEnzymeSim();
});
