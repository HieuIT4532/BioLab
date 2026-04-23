document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('logisticChart').getContext('2d');
    let logisticChart;

    const n0Slider = document.getElementById('n0-slider');
    const rSlider = document.getElementById('r-slider');
    const kSlider = document.getElementById('k-slider');
    
    const n0Val = document.getElementById('n0-val');
    const rVal = document.getElementById('r-val');
    const kVal = document.getElementById('k-val');

    const updateLabels = () => {
        n0Val.textContent = n0Slider.value;
        rVal.textContent = rSlider.value;
        kVal.textContent = kSlider.value;
    };

    const calculateLogistic = (N0, r, K, t) => {
        // Formula: N(t) = K / (1 + ((K - N0) / N0) * e^(-rt))
        return K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
    };

    const runSimulation = () => {
        const N0 = parseFloat(n0Slider.value);
        const r = parseFloat(rSlider.value);
        const K = parseFloat(kSlider.value);
        const maxTime = 100;
        
        const labels = [];
        const data = [];

        for (let t = 0; t <= maxTime; t++) {
            labels.push(t);
            data.push(calculateLogistic(N0, r, K, t).toFixed(2));
        }

        if (logisticChart) {
            logisticChart.destroy();
        }

        logisticChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng quần thể (N)',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Update Insights
        document.getElementById('inflection-point').textContent = Math.round(K / 2);
        const finalN = data[data.length - 1];
        document.getElementById('growth-status').textContent = finalN >= K * 0.95 ? 'Bão hòa (K)' : 'Đang tăng trưởng';
    };

    n0Slider.addEventListener('input', () => { updateLabels(); runSimulation(); });
    rSlider.addEventListener('input', () => { updateLabels(); runSimulation(); });
    kSlider.addEventListener('input', () => { updateLabels(); runSimulation(); });

    document.getElementById('run-logistic').addEventListener('click', runSimulation);

    // Initial Run
    updateLabels();
    runSimulation();
});
