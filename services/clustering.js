function manhattanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum;
}

function seededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function randomCentroids(data, k) {
  const centroids = [];
  const used = new Set();
  const myRandom = seededRandom(42); 
  while (centroids.length < k) {
    const idx = Math.floor(myRandom() * data.length);
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
  const dimensions = data[0].features.length;
  const clustersFeatures = Array.from({ length: k }, () => []);

  for (let i = 0; i < data.length; i++) {
    clustersFeatures[assignments[i]].push(data[i].features);
  }

  const centroids = [];
  for (let i = 0; i < k; i++) {
    const pts = clustersFeatures[i];
    if (pts.length === 0) {
      const myRandom = seededRandom(42 + i);
      const randomIdx = Math.floor(myRandom() * data.length);
      centroids.push([...data[randomIdx].features]);
    } else {
      const centroid = [];
      for (let j = 0; j < dimensions; j++) {
        const dimValues = pts.map(p => p[j]).sort((a, b) => a - b);
        const half = Math.floor(dimValues.length / 2);
        if (dimValues.length % 2 !== 0) {
          centroid.push(dimValues[half]);
        } else {
          centroid.push((dimValues[half - 1] + dimValues[half]) / 2.0);
        }
      }
      centroids.push(centroid);
    }
  }
  return centroids;
}

function silhouetteScore(data, assignments, centroids) {
  const k = centroids.length;
  const clusters = Array.from({ length: k }, () => []);
  for (let i = 0; i < data.length; i++) clusters[assignments[i]].push(data[i]);

  const scores = [];
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    const cIdx = assignments[i];
    const inCluster = clusters[cIdx].filter(x => x !== p);

    if (inCluster.length === 0) {
      scores.push(0);
      continue;
    }

    const a = inCluster.reduce((sum, q) => sum + manhattanDistance(p.features, q.features), 0) / inCluster.length;

    let b = Infinity;
    for (let j = 0; j < k; j++) {
      if (j === cIdx) continue;
      const other = clusters[j];
      if (other.length === 0) continue;
      const avg = other.reduce((sum, q) => sum + manhattanDistance(p.features, q.features), 0) / other.length;
      if (avg < b) b = avg;
    }

    const s = (b === Infinity) ? 0 : (b - a) / Math.max(a, b);
    scores.push(s);
  }

  return scores.reduce((s, v) => s + v, 0) / scores.length;
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

  const points = data.map((d, idx) => {
    // Hitung rata-rata nilai dari seluruh fitur (features) data ini
    const sumFeatures = d.features.reduce((a, b) => a + b, 0);
    const avgFeatures = sumFeatures / d.features.length;
    
    // Tentukan kategori sesuai rentang yang diinginkan
    let kategori = 'Menengah';
    if (avgFeatures < 62) {
      kategori = 'Rendah';
    } else if (avgFeatures > 79) {
      kategori = 'Tinggi';
    }

    return {
      id: d.id,
      name: d.name,
      surat: d.surat || '',
      ayat: d.ayat || '',
      features: d.features,
      cluster: assignments[idx],
      rata_rata: avgFeatures,
      kategori: kategori
    };
  })
  // PROSES PENGURUTAN: Diurutkan dari rata_rata tertinggi ke terendah
  .sort((a, b) => b.rata_rata - a.rata_rata);
  
  return { clusters, centroids, silhouette, assignments, points };
}

module.exports = { manhattanDistance, kmeans, silhouetteScore };