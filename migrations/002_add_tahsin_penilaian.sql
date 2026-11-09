-- ============================================================
-- Migration: Tahsin assessment (penilaian per indikator + catatan)
-- Project: HalaqohV2
-- ============================================================
-- Skala tiap indikator: 1=Belum dikuasai, 2=Perlu bimbingan,
--                        3=Dalam proses perkembangan, 4=Sudah dikuasai

CREATE TABLE IF NOT EXISTS tahsin_penilaian (
  id INT AUTO_INCREMENT PRIMARY KEY,
  santri_id INT NOT NULL,
  halaqoh_id INT NULL,
  guru_id INT NULL,
  tanggal DATE NOT NULL,
  makharijul TINYINT NOT NULL DEFAULT 1,
  tajwid TINYINT NOT NULL DEFAULT 1,
  kelancaran TINYINT NOT NULL DEFAULT 1,
  catatan TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_tahsin_santri (santri_id),
  INDEX idx_tahsin_halaqoh (halaqoh_id),
  INDEX idx_tahsin_tanggal (tanggal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
