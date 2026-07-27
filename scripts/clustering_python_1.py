import json
import random
import sys

def manhattan_distance(a, b):
    return sum(abs(x - y) for x, y in zip(a, b))

def random_centroids(data, k, seed=42):
    rng = random.Random(seed)
    centroids = []
    used_indexes = set()
    while len(centroids) < k:
        index = rng.randrange(len(data))
        if index in used_indexes:
            continue
        used_indexes.add(index)
        centroids.append(list(data[index]['features']))
    return centroids

def assign_clusters(data, centroids):
    assignments = []
    for point in data:
        best_index = 0
        best_distance = float('inf')
        for index, centroid in enumerate(centroids):
            distance = manhattan_distance(point['features'], centroid)
            if distance < best_distance:
                best_distance = distance
                best_index = index
        assignments.append(best_index)
    return assignments

def update_centroids(data, assignments, k):
    dim = len(data[0]['features'])
    clusters_features = [[] for _ in range(k)]
    
    for point, assignment in zip(data, assignments):
        clusters_features[assignment].append(point['features'])
        
    centroids = []
    for i in range(k):
        if not clusters_features[i]:
            random_point = random.choice(data)['features']
            centroids.append(list(random_point))
        else:
            centroid = []
            num_points = len(clusters_features[i])
            for j in range(dim):
                dim_values = sorted([pt[j] for pt in clusters_features[i]])
                if num_points % 2 == 1:
                    median = dim_values[num_points // 2]
                else:
                    median = (dim_values[num_points // 2 - 1] + dim_values[num_points // 2]) / 2.0
                centroid.append(median)
            centroids.append(centroid)
    return centroids

def silhouette_score(data, assignments):
    k = max(assignments) + 1 if assignments else 0
    clusters = [[] for _ in range(k)]
    for index, assignment in enumerate(assignments):
        clusters[assignment].append(index)

    scores = []
    for index, point in enumerate(data):
        current_cluster = assignments[index]
        same_cluster = [j for j in clusters[current_cluster] if j != index]
        
        if not same_cluster:
            scores.append(0.0)
            continue

        a = sum(manhattan_distance(point['features'], data[j]['features']) for j in same_cluster) / len(same_cluster)

        b = float('inf')
        for cluster_id in range(k):
            if cluster_id == current_cluster:
                continue
            other_cluster = clusters[cluster_id]
            if not other_cluster:
                continue
            avg_distance = sum(manhattan_distance(point['features'], data[j]['features']) for j in other_cluster) / len(other_cluster)
            if avg_distance < b:
                b = avg_distance

        if b == float('inf'):
            s = 0.0
        else:
            s = (b - a) / max(a, b)
        scores.append(s)

    return sum(scores) / len(scores) if scores else 0.0

def run_clustering(data, k, max_iter):
    if not data:
        return {
            'clusters': {},
            'centroids': [],
            'silhouette': 0.0,
            'assignments': [],
            'points': []
        }

    centroids = random_centroids(data, k)
    assignments = []
    for _ in range(max_iter):
        new_assignments = assign_clusters(data, centroids)
        if assignments and new_assignments == assignments:
            break
        assignments = new_assignments
        centroids = update_centroids(data, assignments, k)

    if not assignments:
        assignments = assign_clusters(data, centroids)

    silhouette = silhouette_score(data, assignments)
    clusters = {}
    for index, assignment in enumerate(assignments):
        clusters.setdefault(str(assignment), []).append(data[index]['id'])

   points = []
    for index, point in enumerate(data):
        # Hitung rata-rata nilai fitur
        avg_features = sum(point['features']) / len(point['features'])
        
        # Penentuan kategori skripsi
        kategori = 'Menengah'
        if avg_features < 62:
            kategori = 'Rendah'
        elif avg_features > 79:
            kategori = 'Tinggi'

        points.append({
            'id': point['id'],
            'name': point.get('name'),
            'surat': point.get('surat', ''),
            'ayat': point.get('ayat', ''),
            'features': point['features'],
            'cluster': assignments[index],
            'rata_rata': avg_features,
            'kategori': kategori
        })

    # PROSES PENGURUTAN DI PYTHON: Berdasarkan rata_rata secara descending
    points.sort(key=lambda x: x['rata_rata'], reverse=True)

    return {
        'clusters': clusters,
        'centroids': centroids,
        'silhouette': silhouette,
        'assignments': assignments,
        'points': points
    }

def main():
    try:
        payload = json.load(sys.stdin)
        data = payload.get('data', [])
        k = int(payload.get('k', 3))
        max_iter = int(payload.get('maxIter', 100))
        result = run_clustering(data, k, max_iter)
        json.dump(result, sys.stdout)
    except Exception as exc:
        json.dump({'error': str(exc)}, sys.stdout)
        sys.exit(1)

if __name__ == '__main__':
    main()