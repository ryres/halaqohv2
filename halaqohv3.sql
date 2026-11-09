-- ======================================================
-- HALAQOH V3 - DATABASE BARU
-- ======================================================
-- Fresh install untuk aplikasi Halaqoh Tahfizh.
-- Tidak mengubah database tahfizh atau file SQL versi sebelumnya.

CREATE DATABASE IF NOT EXISTS halaqohv3
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE halaqohv3;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'guru_tahfizh') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(100),
    unit VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guru_nama (nama)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS halaqoh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_halaqoh VARCHAR(100) NOT NULL,
    guru_id INT NULL,
    ruangan VARCHAR(50),
    jadwal VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_halaqoh_nama (nama_halaqoh),
    INDEX idx_halaqoh_guru_id (guru_id),
    CONSTRAINT fk_halaqoh_guru
        FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS santri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kelas VARCHAR(50),
    juz INT NULL,
    surat VARCHAR(50),
    ayat INT NULL,
    ayat_from INT NULL,
    ayat_to INT NULL,
    setoran_tgl DATE NULL,
    tajwid INT NULL,
    kelancaran INT NULL,
    makhraj INT NULL,
    baris INT NULL,
    halaqoh_id INT NULL,
    guru_id INT NULL,
    target_juz INT NOT NULL DEFAULT 30,
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_santri_nama (nama),
    INDEX idx_santri_juz (juz),
    INDEX idx_santri_ayat_from (ayat_from),
    INDEX idx_santri_ayat_to (ayat_to),
    INDEX idx_santri_setoran_tgl (setoran_tgl),
    INDEX idx_santri_halaqoh_id (halaqoh_id),
    INDEX idx_santri_guru_id (guru_id),
    INDEX idx_santri_user_id (user_id),
    CONSTRAINT fk_santri_halaqoh
        FOREIGN KEY (halaqoh_id) REFERENCES halaqoh(id) ON DELETE SET NULL,
    CONSTRAINT fk_santri_guru
        FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE SET NULL,
    CONSTRAINT fk_santri_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_santri_target_juz CHECK (target_juz BETWEEN 1 AND 30),
    CONSTRAINT chk_santri_ayat_range CHECK (
        (ayat_from IS NULL AND ayat_to IS NULL) OR
        (ayat_from IS NOT NULL AND ayat_to IS NOT NULL AND ayat_from >= 1 AND ayat_to >= ayat_from)
    ),
    CONSTRAINT chk_santri_scores CHECK (
        (tajwid IS NULL OR tajwid BETWEEN 0 AND 100) AND
        (kelancaran IS NULL OR kelancaran BETWEEN 0 AND 100) AND
        (makhraj IS NULL OR makhraj BETWEEN 0 AND 100)
    )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS delete_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    santri_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'deleted') NOT NULL DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_delete_status (status),
    INDEX idx_delete_requested_by (requested_by),
    INDEX idx_delete_approved_at (approved_at),
    CONSTRAINT fk_delete_santri
        FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    CONSTRAINT fk_delete_requester
        FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_logs_created_at (created_at),
    INDEX idx_logs_user_id (user_id),
    INDEX idx_logs_action (action),
    CONSTRAINT fk_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('success', 'info', 'warning', 'danger') NOT NULL DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_read (user_id, is_read),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
