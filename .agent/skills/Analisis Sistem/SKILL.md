# Skema & Panduan Logika Backend (skill.md)

**Role Pengguna:** Koordinator Tahfizh dan Halaqoh  
**Deskripsi Tugas:** Mengelola data santri, halaqoh tahfizh, guru tahfizh, serta melakukan analisis pengelompokan (Clustering K-Means) performa hafalan untuk evaluasi akademik.

---

## 1. Pemetaan Fitur CRUD Utama (Berdasarkan database.sql)

Gunakan pola arsitektur MVC atau Service-Repository pada Node.js + Express untuk mengisolasi logika bisnis (*logic hooks*).

### A. Manajemen Guru (Tabel `guru`)
* **Create:** Menambahkan guru tahfizh baru (`nama`, `jabatan`, `unit`).
* **Read:** Mengambil daftar guru untuk di-mapping ke dropdown halaqoh/santri.
* **Update:** Mengubah status jabatan atau unit kerja guru.
* **Delete:** Menggunakan klausa `ON DELETE SET NULL`. Jika guru dihapus, relasi di tabel `halaqoh` dan `santri` otomatis diset menjadi `NULL` tanpa memutus data santri.

### B. Manajemen Halaqoh (Tabel `halaqoh`)
* **Create:** Membuka kelompok halaqoh baru dengan memetakan `guru_id`, `ruangan`, dan `jadwal`.
* **Read:** Menampilkan daftar halaqoh beserta agregasi jumlah santri di dalamnya.
* **Update/Delete:** Update informasi jadwal dan ruangan. Delete menerapkan `ON DELETE SET NULL` pada santri yang terikat.

### C. Manajemen Data & Setoran Santri (Tabel `santri`)
* **Create/Import:** Melakukan input data santri baru atau import via excel (sesuai spesifikasi Dataset).
* **Read (Lazy Loading & Pagination):** > **Rule Performa (Design System):** Wajib menggunakan pagination pada query SQL (`LIMIT` & `OFFSET`) untuk menjaga beban browser memori tetap < 150MB.
* **Update (Logika Setoran):** Setiap kali progress hafalan updated (`juz`, `surat`, `ayat`, `tajwid`, `kelancaran`, `makhraj`), sistem otomatis memperbarui `setoran_tgl`.
* **Delete Request Workflow:**
    * Guru/User tidak bisa langsung menghapus data santri. Action 'Delete' akan membuat baris baru di tabel `delete_requests` dengan status `pending`.
    * Koordinator (Admin) menyetujui request $\rightarrow$ status berubah jadi `approved`/`deleted` $\rightarrow$ trigger penghapusan data santri asli (`ON DELETE CASCADE` akan membersihkan request terkait).

---

## 2. Logic Hooks: Pipeline Clustering K-Means

Sesuai dengan `design-system.md`, fitur utama aplikasi ini adalah pengelompokan halaqoh menggunakan **K-Means dengan Manhattan Distance** dan **Silhouette Score**. Di bawah ini adalah alur logika yang harus ditulis oleh programmer handal pada file `public/js/clustering.js` atau sisi backend:

### Langkah 1: Ekstraksi Data (Feature Extraction)
Ambil data numerik dari tabel `santri` yang merepresentasikan performa akademik hafalan untuk dijadikan matriks koordinat data ($X$):
* $X_1$: Target Capaian (`juz`)
* $X_2$: Nilai `tajwid` (Skala 1-100)
* $X_3$: Nilai `kelancaran` (Skala 1-100)
* $X_4$: Nilai `makhraj` (Skala 1-100)

### Langkah 2: Hitung Jarak Manhattan (Manhattan Distance Hook)
Gunakan Manhattan Distance ($L_1$ norm) alih-alih Euclidean untuk menghitung kedekatan jarak antara data santri ($p$) dengan titik pusat cluster/centroid ($q$).

### Pilihan Engine Clustering
Saat mengembangkan fitur clustering, pertimbangkan dua opsi engine:
* JavaScript: jalur utama yang sudah terintegrasi dengan aplikasi Node.js.
* Python: opsi tambahan untuk perhitungan clustering yang sama, terutama saat ingin memanfaatkan skrip Python terpisah.

Ketika membuat fitur ini, pastikan:
* UI menampilkan pilihan engine yang jelas.
* Backend menerima parameter engine dari request.
* Jika engine Python dipilih, proses harus memakai skrip Python terpisah dan mengembalikan output dengan format yang sama dengan JavaScript.
* Jika engine Python gagal, aplikasi tetap memberikan pesan error yang rapi dan tidak merusak pengalaman pengguna.

$$\text{Distance}(p, q) = \sum_{i=1}^{n} |p_i - q_i|$$

```javascript
function manhattanDistance(pointA, pointB) {
    return pointA.reduce((sum, val, i) => sum + Math.abs(val - pointB[i]), 0);
}
Setiap kali Koordinator Tahfizh melakukan operasi CRUD (terutama mengubah data santri atau memproses ulang clustering), jalankan hook otomatis untuk mengisi tabel `logs` jalankan perintah berikut : 
INSERT INTO logs (user_id, username, action, details, ip_address) 
VALUES (current_user_id, current_username, 'UPDATE_SANTRI', 'Mengubah data halaqoh santri A', client_ip);
