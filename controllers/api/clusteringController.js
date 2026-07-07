const clusteringService = require('../../services/clustering');
const pool = require('../../config/database');
const { spawn } = require('child_process');
const path = require('path');

function clusterLabel(avgScore) {
  if (avgScore > 79) return 'Tinggi';
  if (avgScore >= 63) return 'Menengah';
  return 'Rendah';
}

function clusterColor(label) {
  if (label === 'Tinggi') return '#16a34a';
  if (label === 'Menengah') return '#f59e0b';
  if (label === 'Rendah') return '#ef4444';
  return '#6D28D9';
}

exports.process = async (req, res) => {
  try {
    const k = parseInt(req.body.k || '3');
    const maxIter = parseInt(req.body.maxIter || '100');
    const engine = (req.body.engine || 'javascript').toLowerCase();

    // fetch features and names from santri (include juz, surat, ayat)
    const [rows] = await pool.query('SELECT id, nama, COALESCE(juz,0) as juz, COALESCE(surat,"") as surat, COALESCE(ayat,"") as ayat, COALESCE(tajwid,0) as tajwid, COALESCE(kelancaran,0) as kelancaran, COALESCE(makhraj,0) as makhraj FROM santri');
    const data = rows.map(r => ({ id: r.id, name: r.nama, juz: r.juz, surat: r.surat, ayat: r.ayat, features: [r.tajwid, r.kelancaran, r.makhraj] }));

    let result;
    if (engine === 'python') {
      const scriptPath = path.join(__dirname, '../../scripts/clustering_python.py');
      const pythonProcess = spawn('python', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
      const payload = JSON.stringify({ data, k, maxIter });
      pythonProcess.stdin.write(payload);
      pythonProcess.stdin.end();

      let stdout = '';
      let stderr = '';
      pythonProcess.stdout.on('data', chunk => { stdout += chunk.toString(); });
      pythonProcess.stderr.on('data', chunk => { stderr += chunk.toString(); });

      const exitCode = await new Promise((resolve) => pythonProcess.on('close', resolve));
      if (exitCode !== 0) {
        throw new Error(stderr || 'Python clustering failed');
      }

      result = JSON.parse(stdout);
      if (result.error) {
        throw new Error(result.error);
      }
    } else {
      result = clusteringService.kmeans(data, k, { maxIter });
    }

    const clusterSizes = Object.keys(result.clusters || {}).map(c => ({ cluster: c, size: result.clusters[c].length }));

    const clusterStats = Object.keys(result.clusters || {}).map(clusterId => {
      const members = data.filter((d, idx) => result.assignments[idx] === parseInt(clusterId));
      const avgScore = members.reduce((sum, m) => {
        const featureScore = (m.features[0] + m.features[1] + m.features[2]) / 3;
        return sum + featureScore;
      }, 0) / (members.length || 1);
      const label = clusterLabel(avgScore);
      const centroid = result.centroids[clusterId] || [0, 0, 0];
      const color = clusterColor(label);
      return {
        cluster: parseInt(clusterId),
        label,
        avgScore: +avgScore.toFixed(2),
        size: members.length,
        centroid,
        color
      };
    });

    const points = data.map((d, idx) => {
      const clusterId = result.assignments[idx];
      const stats = clusterStats.find(c => c.cluster === clusterId) || { label: 'Menengah', color: '#6D28D9' };
      return {
        id: d.id,
        name: d.name,
        juz: d.juz,
        surat: d.surat || '',
        ayat: d.ayat || '',
        features: d.features,
        cluster: clusterId,
        label: stats.label,
        color: stats.color
      };
    });

    if (result.silhouette < 0.25) {
      await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [null, 'Low Silhouette', `Silhouette score is ${result.silhouette}`, 'warning', '/clustering/result']);
    }

    res.json({
      clusters: result.clusters,
      centroids: result.centroids,
      silhouette: result.silhouette,
      assignments: result.assignments,
      points,
      clusterSizes,
      clusterStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.result = async (req, res) => {
  res.json({ message: 'Use POST /api/clustering/process to run clustering' });
};
