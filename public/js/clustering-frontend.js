document.addEventListener('DOMContentLoaded', () => {
  async function fetchAndRender() {
    try {
      const res = await fetch('/api/clustering/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: 3 })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error || 'Response error');

      const points = Array.isArray(data.points) ? data.points : [];
      const stats = Array.isArray(data.clusterStats) ? data.clusterStats : [];
      const palette = ['#16a34a', '#f59e0b', '#ef4444', '#6D28D9', '#8B5CF6'];

      // Build scatter dataset by cluster label if available, otherwise by cluster index
      const scatterGroups = {};
      points.forEach(p => {
        const key = p.label || `Cluster ${p.cluster}`;
        scatterGroups[key] = scatterGroups[key] || [];
        scatterGroups[key].push({
          x: p.features && p.features.length > 1 ? p.features[1] : 0,
          y: p.features && p.features.length > 2 ? p.features[2] : 0,
          id: p.id
        });
      });

      const scatterLabels = Object.keys(scatterGroups);
      const scatterDatasets = scatterLabels.map((label, index) => ({
        label,
        data: scatterGroups[label],
        backgroundColor: palette[index % palette.length],
        pointRadius: 5
      }));

      const scatterCanvas = document.getElementById('scatterChart');
      if (scatterCanvas) {
        const ctx = scatterCanvas.getContext('2d');
        new Chart(ctx, {
          type: 'scatter',
          data: { datasets: scatterDatasets },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: true } },
            scales: {
              x: { title: { display: true, text: 'Tajwid' } },
              y: { title: { display: true, text: 'Kelancaran' } }
            }
          }
        });
      }

      // Bar chart from clusterStats
      const barLabels = stats.map(s => s.label || `Cluster ${s.cluster}`);
      const barData = stats.map(s => s.size || 0);
      const barColors = stats.map(s => s.color || palette[0]);
      const barCanvas = document.getElementById('barChart');
      if (barCanvas) {
        const ctx = barCanvas.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: { labels: barLabels, datasets: [{ label: 'Jumlah Santri', data: barData, backgroundColor: barColors }] },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
          }
        });
      }

      // Radar chart from clusterStats centroids
      const radarDatasets = stats.map((s, index) => ({
        label: s.label || `Cluster ${s.cluster}`,
        data: Array.isArray(s.centroid) ? s.centroid.slice(0, 3) : [0, 0, 0],
        backgroundColor: (s.color || palette[index % palette.length]) + '55',
        borderColor: s.color || palette[index % palette.length],
        fill: true
      }));
      const radarCanvas = document.getElementById('radarChart');
      if (radarCanvas) {
        const ctx = radarCanvas.getContext('2d');
        new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Tajwid', 'Kelancaran', 'Makhraj'],
            datasets: radarDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: true
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  fetchAndRender();
});
