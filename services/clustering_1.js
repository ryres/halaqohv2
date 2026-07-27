function manhattanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum;
}

function randomCentroids(data, k) {
  const centroids = [];
  const used = new Set();
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * data.length);
    if (!used.has(idx)) {
      used.add(idx);
      centroids.push([...data[idx].features]);
    }
  }
  return centroids;
}

function assignClusters(data, centroids) {
  const assignments = [];
  for (const point of data) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const d = manhattanDistance(point.features, centroids[i]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    assignments.push(best);
  }
  return assignments;
}

function updateCentroids(data, assignments, k) {
  const sums = Array.from({ length: k }, () => null);
  const counts = Array(k).fill(0);
  for (let i = 0; i < data.length; i++) {
    const a = assignments[i];
    if (!sums[a]) sums[a] = Array(data[i].features.length).fill(0);
    for (let j = 0; j < data[i].features.length; j++) sums[a][j] += data[i].features[j];
    counts[a]++;
  }
  const centroids = [];
  for (let i = 0; i < k; i++) {
    if (counts[i] === 0) {
      centroids.push(sums[i] ? sums[i].map(v => v / 1) : Array(data[0].features.length).fill(0));
    } else {
      centroids.push(sums[i].map(v => v / counts[i]));
    }
  }
  return centroids;
}

function silhouetteScore(data, assignments, centroids) {
  // For each point, compute a(i) = avg distance to other points in same cluster
  // b(i) = min over other clusters of avg distance to points in that cluster
  const k = centroids.length;
  const clusters = Array.from({ length: k }, () => []);
  for (let i = 0; i < data.length; i++) clusters[assignments[i]].push(data[i]);

  const scores = [];
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    const cIdx = assignments[i];
    const inCluster = clusters[cIdx].filter(x => x !== p);

    let a = 0;
    if (inCluster.length === 0) a = 0;
    else {
      a = inCluster.reduce((sum, q) => sum + manhattanDistance(p.features, q.features), 0) / inCluster.length;
    }

    let b = Infinity;
    for (let j = 0; j < k; j++) {
      if (j === cIdx) continue;
      const other = clusters[j];
      if (other.length === 0) continue;
      const avg = other.reduce((sum, q) => sum + manhattanDistance(p.features, q.features), 0) / other.length;
      if (avg < b) b = avg;
    }

    const s = (b === Infinity && a === 0) ? 0 : (b - a) / Math.max(a, b);
    scores.push(s);
  }

  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  return mean;
}

function kmeans(data, k, opts = {}) {
  const maxIter = opts.maxIter || 100;
  if (data.length === 0) return { clusters: [], centroids: [], silhouette: 0 };

  let centroids = randomCentroids(data, k);
  let assignments = [];
  for (let iter = 0; iter < maxIter; iter++) {
    const newAssignments = assignClusters(data, centroids);
    let changed = false;
    if (assignments.length === 0) changed = true;
    else {
      for (let i = 0; i < newAssignments.length; i++) if (newAssignments[i] !== assignments[i]) { changed = true; break; }
    }
    assignments = newAssignments;
    if (!changed) break;
    centroids = updateCentroids(data, assignments, k);
  }

  const silhouette = silhouetteScore(data, assignments, centroids);

  const clusters = {};
  for (let i = 0; i < data.length; i++) {
    const c = assignments[i];
    if (!clusters[c]) clusters[c] = [];
    clusters[c].push(data[i].id);
  }

  // include points array (id + features) and assignments for frontend
  const points = data.map((d, idx) => ({ id: d.id, name: d.name, surat: d.surat || '', ayat: d.ayat || '', features: d.features, cluster: assignments[idx] }));

  return { clusters, centroids, silhouette, assignments, points };
}

module.exports = { manhattanDistance, kmeans, silhouetteScore };
