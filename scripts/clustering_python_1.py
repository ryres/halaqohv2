import json
import sys

try:
    import numpy as np
    from sklearn.metrics import silhouette_score
except ModuleNotFoundError as exc:
    raise SystemExit(f"Missing Python dependency: {exc.name}. Run: pip install -r requirements.txt")

# Menghasilkan satu jarak Manhattan untuk setiap baris data terhadap centroid.
def manhattan_distance_numpy(X, centroid):
    return np.sum(np.abs(X - centroid), axis=1)

# Membandingkan jarak setiap data ke seluruh centroid dan memilih indeks terdekat.
def assign_clusters_numpy(X, centroids):
    distances = np.array([manhattan_distance_numpy(X, centroid) for centroid in centroids])
    return np.argmin(distances, axis=0)

def deterministic_centroids(X, k):
    """Membuat centroid awal tanpa random berdasarkan rentang setiap fitur."""
    # Untuk k=3, urutan cluster awal adalah: maksimum, median, minimum.
    mins = np.min(X, axis=0)
    medians = np.median(X, axis=0)
    maxs = np.max(X, axis=0)
    if k == 3:
        return np.array([maxs, medians, mins])

    # Untuk k selain 3, gunakan posisi kuantil yang tersebar secara deterministik.
    quantile_positions = np.linspace(1, 0, k)
    return np.array([np.quantile(X, position, axis=0) for position in quantile_positions])

def update_centroids_numpy(X, labels, k):
    # Setiap centroid baru dihitung dari seluruh data yang mendapat label tersebut.
    centroids = np.zeros((k, X.shape[1]))
    for cluster_index in range(k):
        points = X[labels == cluster_index]
        if len(points) > 0:
            # Persamaan centroid K-Means: c_j = (1 / n_j) * sum(x_i).
            centroids[cluster_index] = np.sum(points, axis=0) / len(points)
        else:
            # Fallback deterministik agar cluster kosong tidak memakai pilihan acak.
            centroids[cluster_index] = X[cluster_index % len(X)]
    return centroids

def silhouette_score_manhattan(X, labels):
    # Scikit-learn membutuhkan minimal dua label cluster untuk menghitung skor.
    if len(np.unique(labels)) < 2:
        return 0.0
    return float(silhouette_score(X, labels, metric='manhattan'))


def kmeans_numpy(X, k=3, max_iter=100, seed=42):
    # Parameter seed dipertahankan untuk kompatibilitas, tetapi tidak digunakan
    # karena seluruh inisialisasi centroid sekarang bersifat deterministik.
    centroids = deterministic_centroids(X, k)
    labels = np.zeros(X.shape[0], dtype=int)

    for iteration in range(max_iter):
        # Assignment memakai centroid saat ini, lalu centroid diperbarui.
        new_labels = assign_clusters_numpy(X, centroids)
        if np.array_equal(new_labels, labels) and iteration > 0:
            # Tidak ada perubahan label berarti algoritma sudah konvergen.
            break
        labels = new_labels
        centroids = update_centroids_numpy(X, labels, k)

    return labels, centroids, silhouette_score_manhattan(X, labels)

def run_clustering(data, k, max_iter):
    # Bentuk respons kosong dipertahankan agar aman saat tidak ada data santri.
    if not data:
        return {
            'clusters': {},
            'centroids': [],
            'silhouette': 0.0,
            'assignments': [],
            'points': []
        }

    # Konversi fitur ke matriks numerik agar operasi NumPy konsisten.
    features = np.asarray([point['features'] for point in data], dtype=float)
    # Validasi ini mencegah dimensi kosong, nilai NaN, dan nilai tak hingga.
    if features.ndim != 2 or features.shape[1] == 0 or not np.isfinite(features).all():
        raise ValueError('All data points must contain finite numeric features')
    if not isinstance(k, int) or k < 1 or k > len(data):
        raise ValueError('k must be an integer between 1 and the number of data points')
    if not isinstance(max_iter, int) or max_iter < 1:
        raise ValueError('max_iter must be a positive integer')

    # Jalankan clustering; assignments tetap mengikuti urutan data input.
    assignments, centroids, silhouette = kmeans_numpy(features, k, max_iter)
    clusters = {}
    for index, assignment in enumerate(assignments):
        # API mengelompokkan ID santri berdasarkan indeks cluster internal.
        clusters.setdefault(str(int(assignment)), []).append(data[index]['id'])

    points = []
    for index, point in enumerate(data):
        # Tambahkan metadata tampilan tanpa mengubah fitur asli dari input.
        avg_features = float(np.mean(features[index]))
        kategori = 'Rendah' if avg_features < 63 else 'Tinggi' if avg_features > 81 else 'Menengah'

        points.append({
            'id': point['id'],
            'name': point.get('name'),
            'surat': point.get('surat', ''),
            'ayat': point.get('ayat', ''),
            'features': point['features'],
            'cluster': int(assignments[index]),
            'rata_rata': avg_features,
            'kategori': kategori
        })

    # PROSES PENGURUTAN DI PYTHON: Berdasarkan rata_rata secara descending
    points.sort(key=lambda x: x['rata_rata'], reverse=True)

    return {
        'clusters': clusters,
        'centroids': centroids.tolist(),
        'silhouette': silhouette,
        'assignments': assignments.tolist(),
        'points': points
    }

def main():
    try:
        # Node.js mengirim payload JSON melalui stdin ke proses Python.
        payload = json.load(sys.stdin)
        data = payload.get('data', [])
        k = int(payload.get('k', 3))
        max_iter = int(payload.get('maxIter', 100))
        result = run_clustering(data, k, max_iter)
        # Hasil dikirim kembali ke Node.js sebagai JSON melalui stdout.
        json.dump(result, sys.stdout)
    except Exception as exc:
        # Error juga dikembalikan sebagai JSON agar dapat ditangani controller.
        json.dump({'error': str(exc)}, sys.stdout)
        sys.exit(1)

if __name__ == '__main__':
    main()