-- ======================================================
-- MIGRASI DATABASE V2: FIELD RENTANG AYAT SANTRI
-- ======================================================
-- Jalankan setelah database.sql atau tahfizh.sql.
-- Migrasi ini tidak menghapus atau menimpa kolom/data lama.

ALTER TABLE santri
    ADD COLUMN IF NOT EXISTS ayat_from INT NULL AFTER surat,
    ADD COLUMN IF NOT EXISTS ayat_to INT NULL AFTER ayat_from;

-- Pertahankan data lama dan isi rentang baru dari kolom ayat tunggal.
UPDATE santri
SET ayat_from = ayat
WHERE ayat_from IS NULL AND ayat IS NOT NULL;

UPDATE santri
SET ayat_to = ayat
WHERE ayat_to IS NULL AND ayat IS NOT NULL;

-- Indeks untuk pencarian berdasarkan rentang ayat.
CREATE INDEX IF NOT EXISTS idx_santri_ayat_from ON santri (ayat_from);
CREATE INDEX IF NOT EXISTS idx_santri_ayat_to ON santri (ayat_to);
