# Design System

## Project Overview

Aplikasi dashboard penelitian untuk analisis dan visualisasi clustering menggunakan algoritma K-Means dengan Manhattan Distance dan evaluasi Silhouette Score.

### Technology Stack

* Backend: Node.js + Express.js
* Database: MySQL
* Frontend: EJS / HTML Template Engine
* CSS Framework: Bootstrap 5
* Chart Library: Chart.js
* Icons: Bootstrap Icons
* Data Processing: JavaScript (Node.js) sebagai jalur utama, dengan opsi tambahan Python untuk proses clustering yang sama

---

# Design Principles

## 1. Performance First

Prioritas utama adalah aplikasi ringan, cepat, dan hemat memori.

### Rules

* Hindari library frontend yang berat.
* Gunakan Bootstrap tanpa framework tambahan.
* Gunakan Chart.js dibandingkan D3.js karena lebih ringan.
* Minify CSS dan JavaScript saat production.
* Gunakan lazy loading untuk tabel besar.
* Pagination wajib untuk data penelitian.
* Hindari rendering chart yang tidak digunakan.
* Maksimal 3 chart aktif dalam satu halaman.

### Target Performance

* First Load < 2 detik
* Dashboard Load < 1 detik
* Memory Browser < 150 MB
* Responsive di desktop dan laptop
* Engine clustering dapat dipilih saat proses, tanpa memengaruhi performa aplikasi saat mode default

---

# 2. UI/UX Guidelines

## Design Goal

Modern Academic Dashboard

Karakter:

* Elegan
* Profesional
* Bersih
* Minimalis
* Fokus pada data penelitian

### UX Principles

#### Easy Navigation

Menu maksimal:

* Dashboard
* Dataset
* Clustering
* Hasil
* Evaluasi
* Laporan

#### Consistency

* Semua tombol memiliki bentuk sama
* Semua card memiliki radius sama
* Semua tabel menggunakan style yang sama
* Semua chart menggunakan tema yang sama
* Tombol pemilihan engine clustering wajib konsisten dengan desain tombol utama aplikasi

#### Readability

Minimal ukuran font:

* Heading: 24px
* Sub Heading: 18px
* Body: 14px
* Table: 13px

---

# 3. Color System

## Primary Theme

Elegant Purple Research Dashboard

### Primary Colors

```css
--primary: #6D28D9;
--primary-light: #8B5CF6;
--primary-dark: #5B21B6;
```

### Secondary Colors

```css
--secondary: #A78BFA;
```

### Background

```css
--bg-main: #F8F7FF;
--bg-card: #FFFFFF;
--bg-sidebar: #FFFFFF;
```

### Text

```css
--text-primary: #1F2937;
--text-secondary: #6B7280;
```

### Status Colors

```css
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--info: #3B82F6;
```

---

# 4. Typography

## Font Family

Gunakan:

```text
Poppins
```

Fallback:

```text
Segoe UI, sans-serif
```

### Font Weight

| Usage      | Weight |
| ---------- | ------ |
| Title      | 700    |
| Heading    | 600    |
| Subheading | 500    |
| Body       | 400    |

---

# 5. Layout System

## Layout Structure

```text
+--------------------------------+
| Navbar                         |
+----------+---------------------+
| Sidebar  | Main Content        |
|          |                     |
|          | Dashboard Cards     |
|          | Charts              |
|          | Tables              |
+----------+---------------------+
```

---

## Sidebar

Width:

```css
260px
```

Features:

* Collapsible
* Fixed position
* Icon + Label
* Hover animation

---

## Main Content

Padding:

```css
24px
```

Max Width:

```css
1400px
```

Centered layout untuk desktop.

---

# 6. Clustering Engine Selection

## Tujuan

Memberikan pilihan engine clustering kepada pengguna tanpa menghapus alur yang sudah ada. Pengguna dapat memilih antara:

* JavaScript sebagai engine default dan utama
* Python sebagai opsi tambahan untuk kebutuhan eksperimen atau perhitungan terpisah

## Rule

* Implementasi JavaScript tetap menjadi jalur yang dipertahankan untuk aplikasi utama.
* Implementasi Python hanya dipakai saat pengguna memilih opsi Python.
* Hasil akhir dari kedua engine wajib memiliki format output yang sama agar halaman hasil tetap konsisten.
* Jika Python tidak tersedia atau gagal, sistem harus menampilkan pesan error yang jelas dan tidak merusak alur aplikasi.
* UI menyediakan tombol pemilihan engine yang sederhana dan tidak membingungkan.

---

# 7. Card System

## Dashboard Cards

Digunakan untuk:

* Total Data
* Total Cluster
* Silhouette Score
* Akurasi

### Style

```css
border-radius:16px;
padding:20px;
box-shadow:0 2px 10px rgba(0,0,0,0.05);
background:white;
```

### Hover

```css
transform:translateY(-3px);
transition:0.3s;
```

---

# 7. Table Design

## Research Table

Style:

```css
border-radius:12px;
overflow:hidden;
```

Features:

* Search
* Pagination
* Sorting
* Export Excel
* Responsive

### Header

```css
background:#6D28D9;
color:white;
```

---

# 8. Button System

## Primary Button

```css
background:#6D28D9;
color:white;
border-radius:10px;
```

Usage:

* Simpan
* Proses Clustering
* Hitung Silhouette

---

## Secondary Button

```css
background:#F3F4F6;
color:#374151;
```

Usage:

* Reset
* Cancel

---

# 9. Visualization System

## Objective

Visualisasi harus membantu peneliti memahami hasil clustering secara cepat.

---

## Recommended Chart for K-Means

### A. Scatter Plot (Utama)

Digunakan untuk:

* Menampilkan hasil cluster
* Menampilkan centroid
* Melihat pemisahan cluster

Alasan:

* Visualisasi terbaik untuk K-Means
* Mudah melihat distribusi data
* Standar penelitian data mining

Priority:

⭐⭐⭐⭐⭐

---

### B. Bar Chart

Digunakan untuk:

* Jumlah anggota per cluster
* Perbandingan cluster

Priority:

⭐⭐⭐⭐⭐

---

### C. Radar Chart

Digunakan untuk:

* Karakteristik setiap cluster

Contoh:

* Hafalan
* Kehadiran
* Murajaah
* Nilai

Priority:

⭐⭐⭐⭐

---

### D. Line Chart

Digunakan untuk:

* Tren data
* Iterasi K-Means
* Perubahan nilai centroid

Priority:

⭐⭐⭐

---

## Chart Color Palette

Cluster 1

```css
#6D28D9
```

Cluster 2

```css
#8B5CF6
```

Cluster 3

```css
#A78BFA
```

Cluster 4

```css
#C4B5FD
```

Cluster 5

```css
#DDD6FE
```

Centroid

```css
#EF4444
```

---

# 10. Dashboard Pages

## Dashboard

Menampilkan:

* Total Data
* Total Cluster
* Nilai Silhouette Score
* Ringkasan Hasil

Chart:

* Scatter Plot
* Bar Chart

---

## Dataset

Menampilkan:

* Upload Dataset
* Preview Dataset
* Statistik Dataset

---

## Clustering

Menampilkan:

* Input Nilai K
* Pilihan Distance
* Tombol Proses

---

## Hasil Clustering

Menampilkan:

* Data Cluster
* Scatter Plot
* Centroid

---

## Evaluasi

Menampilkan:

* Silhouette Score
* Interpretasi Hasil

---

## Laporan

Menampilkan:

* Export PDF
* Export Excel
* Ringkasan Penelitian

---

# 11. Animation Guidelines

Gunakan animasi ringan.

Durasi:

```css
0.2s - 0.3s
```

Hindari:

* Animasi berlebihan
* Efek berat GPU
* Background bergerak

---

# 12. Responsive Design

## Breakpoints

```css
Mobile : <576px
Tablet : 576px - 991px
Desktop : >=992px
```

### Mobile Rules

* Sidebar menjadi offcanvas
* Chart full width
* Tabel scroll horizontal

---

# 13. Accessibility

* Kontras warna minimal WCAG AA
* Tombol memiliki hover state
* Form memiliki label
* Keyboard navigation aktif
* Semua icon memiliki tooltip

---

# 14. Folder UI Structure

```text
public/
│
├── css/
│   ├── variables.css
│   ├── layout.css
│   ├── dashboard.css
│   └── components.css
│
├── js/
│   ├── dashboard.js
│   ├── clustering.js
│   └── charts.js
│
├── images/
│
views/
│
├── layouts/
├── partials/
├── dashboard/
├── dataset/
├── clustering/
├── result/
└── report/
```

---

# Final Design Direction

Tema aplikasi:

"Pengelompokan Halaqoh Tahfizh"

Karakter utama:

* Modern
* Professional
* Clean
* Data Focused
* Fast Loading
* Memory Efficient
* Responsive
* Research Oriented

Visualisasi utama:

1. Scatter Plot (K-Means Result)
2. Bar Chart (Cluster Distribution)
3. Radar Chart (Cluster Characteristics)
4. Line Chart (Iteration Analysis)

Framework:

* Node.js
* Express.js
* MySQL
* Bootstrap 5
* Chart.js
* EJS
