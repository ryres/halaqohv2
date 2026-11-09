const pool = require('../../config/database');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

function detectPythonCommand() {
  const candidates = process.platform === 'win32'
    ? ['py', 'python', 'python3']
    : ['python3', 'python'];

  for (const command of candidates) {
    try {
      const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
      if (result.status === 0) {
        return command;
      }
    } catch (err) {
      // command not available in PATH; try the next candidate
    }
  }

  return null;
}

function clusterLabel(avgScore) {
  if (avgScore > 79) return 'Tinggi';
  if (avgScore >= 63) return 'Menengah';
  return 'Rendah';
}

function clusterColor(label) {
  if (label.startsWith('Tinggi')) return '#16a34a';
  if (label.startsWith('Menengah')) return '#f59e0b';
  if (label.startsWith('Rendah')) return '#ef4444';
  return '#6D28D9';
}

exports.process = async (req, res) => {
  try {
    const k = parseInt(req.body.k || '3', 10);
    const maxIter = parseInt(req.body.maxIter || '100', 10);
    if (!Number.isInteger(k) || k < 2 || k > 10) {
      throw new Error('Jumlah cluster harus berupa bilangan bulat antara 2 dan 10.');
    }
    if (!Number.isInteger(maxIter) || maxIter < 1 || maxIter > 500) {
      throw new Error('Max iterasi harus berupa bilangan bulat antara 1 dan 500.');
    }

    // fetch features and names from santri (include juz, surat, ayat)
    const [rows] = await pool.query('SELECT id, nama, COALESCE(juz,0) as juz, COALESCE(surat,"") as surat, COALESCE(ayat,"") as ayat, COALESCE(tajwid,0) as tajwid, COALESCE(kelancaran,0) as kelancaran, COALESCE(makhraj,0) as makhraj FROM santri WHERE is_deleted = 0');
    const data = rows.map(r => ({ id: r.id, name: r.nama, juz: r.juz, surat: r.surat, ayat: r.ayat, features: [r.tajwid, r.kelancaran, r.makhraj] }));
    if (data.length < k) throw new Error('Jumlah data santri harus minimal sama dengan jumlah cluster.');

    const scriptPath = path.join(__dirname, '../../scripts/clustering_python_1.py');
    const pythonCommand = detectPythonCommand();
    if (!pythonCommand) {
      throw new Error('Python tidak ditemukan di environment ini. Pastikan Python dan dependency scikit-learn sudah terinstall.');
    }

    const pythonArgs = process.platform === 'win32' && pythonCommand === 'py'
      ? ['-3', scriptPath]
      : [scriptPath];

    const pythonProcess = spawn(pythonCommand, pythonArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
    const payload = JSON.stringify({ data, k, maxIter });
    pythonProcess.stdin.write(payload);
    pythonProcess.stdin.end();

    let stdout = '';
    let stderr = '';
    pythonProcess.stdout.on('data', chunk => { stdout += chunk.toString(); });
    pythonProcess.stderr.on('data', chunk => { stderr += chunk.toString(); });

    const exitCode = await new Promise((resolve) => pythonProcess.on('close', resolve));
    if (exitCode !== 0) {
      const output = [stderr, stdout].filter(Boolean).join('\n').trim();
      throw new Error(output || 'Python clustering failed');
    }

    const trimmedStdout = stdout.trim();
    if (!trimmedStdout) {
      throw new Error(stderr || 'Python clustering failed');
    }

    const result = JSON.parse(trimmedStdout);
    if (result.error) {
      throw new Error(result.error);
    }

    const rawClusterStats = Object.keys(result.clusters || {}).map(clusterId => {
      const members = data.filter((d, idx) => result.assignments[idx] === parseInt(clusterId));
      const avgScore = members.reduce((sum, m) => {
        const featureScore = (m.features[0] + m.features[1] + m.features[2]) / 3;
        return sum + featureScore;
      }, 0) / (members.length || 1);
      const centroid = result.centroids[clusterId] || [0, 0, 0];
      return {
        clusterIndex: parseInt(clusterId, 10),
        avgScore: +avgScore.toFixed(2),
        size: members.length,
        centroid
      };
    });

    const clusterMeta = new Map();
    if (rawClusterStats.length === 3) {
      const ranked = [...rawClusterStats].sort((a, b) => b.avgScore - a.avgScore);
      const namesByRank = [
        { cluster: 'C0', label: 'Tinggi - Mumtaz' },
        { cluster: 'C2', label: 'Menengah - Reguler' },
        { cluster: 'C1', label: 'Rendah - Pembinaan' }
      ];
      ranked.forEach((stat, rank) => clusterMeta.set(stat.clusterIndex, namesByRank[rank]));
    } else {
      rawClusterStats.forEach(stat => clusterMeta.set(stat.clusterIndex, {
        cluster: `C${stat.clusterIndex}`,
        label: clusterLabel(stat.avgScore)
      }));
    }

    const clusterKey = clusterId => clusterMeta.get(Number(clusterId))?.cluster || `C${Number(clusterId)}`;
    const clusters = Object.fromEntries(
      Object.entries(result.clusters || {}).map(([clusterId, members]) => [clusterKey(clusterId), members])
    );
    const clusterSizes = Object.keys(result.clusters || {}).map(c => ({ cluster: clusterKey(c), size: result.clusters[c].length }));
    const clusterStats = rawClusterStats.map(stat => {
      const meta = clusterMeta.get(stat.clusterIndex);
      const label = meta.label;
      return {
        ...stat,
        cluster: meta.cluster,
        label,
        color: clusterColor(label)
      };
    });

    const points = data.map((d, idx) => {
      const clusterId = result.assignments[idx];
      const stats = clusterStats.find(c => c.clusterIndex === clusterId) || { label: 'Menengah - Reguler', color: '#6D28D9' };
      return {
        id: d.id,
        name: d.name,
        juz: d.juz,
        surat: d.surat || '',
        ayat: d.ayat || '',
        features: d.features,
        cluster: clusterKey(clusterId),
        clusterIndex: clusterId,
        label: stats.label,
        color: stats.color
      };
    });

    if (result.silhouette < 0.25) {
      await pool.query('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [null, 'Low Silhouette', `Silhouette score is ${result.silhouette}`, 'warning', '/result']);
    }

    res.json({
      clusters,
      centroids: result.centroids,
      silhouette: result.silhouette,
      assignments: result.assignments,
      engine: 'python',
      distanceMetric: 'manhattan',
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
