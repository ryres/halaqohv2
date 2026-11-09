-- ============================================================
-- Migration: Add soft delete columns
-- Project: HalaqohV2
-- Date: 2026-10-12
-- ============================================================
-- Jalankan SEBELUM deploy perubahan code.
-- Jalankan satu-satu; kalau error "Duplicate column", kolom sudah ada — aman.

-- Tabel users
ALTER TABLE users
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Tabel santri
ALTER TABLE santri
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Tabel halaqoh
ALTER TABLE halaqoh
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Tabel guru
ALTER TABLE guru
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Index untuk performa filter soft delete
CREATE INDEX idx_users_is_deleted ON users (is_deleted);
CREATE INDEX idx_santri_is_deleted ON santri (is_deleted);
CREATE INDEX idx_halaqoh_is_deleted ON halaqoh (is_deleted);
CREATE INDEX idx_guru_is_deleted ON guru (is_deleted);

-- ============================================================
-- CATATAN:
-- 1. Data lama (sebelum migration) tetap is_deleted = 0 (aktif)
-- 2. Setelah migration, semua DELETE di controller = soft delete
-- 3. Data yang soft-delete masih ada di DB tapi tidak tampil di UI/API
-- 4. Untuk lihat data yang dihapus: SELECT * FROM <tabel> WHERE is_deleted = 1
-- 5. Untuk restore (batal hapus): UPDATE <tabel> SET is_deleted = 0, deleted_at = NULL WHERE id = ?
-- 6. Untuk hapus permanen (super-admin only): DELETE FROM <tabel> WHERE id = ? AND is_deleted = 1
-- ============================================================
