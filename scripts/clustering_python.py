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
    sums = [None] * k
    counts = [0] * k

    for point, assignment in zip(data, assignments):
        if sums[assignment] is None:
            sums[assignment] = [0.0] * len(point['features'])
        for j, value in enumerate(point['features']):
            sums[assignment][j] += value
        counts[assignment] += 1

    centroids = []
    for i in range(k):
        if counts[i] == 0:
            if sums[i] is None:
                centroids.append([0.0] * len(data[0]['features']))
            else:
                centroids.append(sums[i][:])
        else:
            centroids.append([value / counts[i] for value in sums[i]])
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
        if same_cluster:
            a = sum(manhattan_distance(point['features'], data[j]['features']) for j in same_cluster) / len(same_cluster)
        else:
            a = 0.0

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

        if b == float('inf') and a == 0:
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
        points.append({
            'id': point['id'],
            'name': point.get('name'),
            'surat': point.get('surat', ''),
            'ayat': point.get('ayat', ''),
            'features': point['features'],
            'cluster': assignments[index]
        })

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
    except Exception as exc:  # pragma: no cover - simple CLI safety
        json.dump({'error': str(exc)}, sys.stdout)
        sys.exit(1)


if __name__ == '__main__':
    main()
