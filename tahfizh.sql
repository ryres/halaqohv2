-- ======================================================
-- TABEL users
-- ======================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','user','guru_tahfizh') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- TABEL santri
-- ======================================================
CREATE TABLE IF NOT EXISTS santri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kelas VARCHAR(50),
    juz INT,
    surat VARCHAR(50),
    ayat INT,
    setoran_tgl DATE,
    tajwid INT,
    kelancaran INT,
    makhraj INT,
    baris INT,
    halaqoh_id INT NULL,
    guru_id INT NULL,
    target_juz INT DEFAULT 30,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (halaqoh_id) REFERENCES halaqoh(id) ON DELETE SET NULL,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE SET NULL
);

-- Index untuk performa
CREATE INDEX idx_nama ON santri (nama);
CREATE INDEX idx_juz ON santri (juz);
CREATE INDEX idx_setoran_tgl ON santri (setoran_tgl);
CREATE INDEX idx_user_id ON santri (user_id);
CREATE INDEX idx_halaqoh_id ON santri (halaqoh_id);
CREATE INDEX idx_guru_id ON santri (guru_id);
CREATE INDEX idx_created_at ON santri (created_at);

-- ======================================================
-- TABEL halaqoh
-- ======================================================
CREATE TABLE IF NOT EXISTS halaqoh (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_halaqoh VARCHAR(100) NOT NULL,
    guru_id INT NULL,
    ruangan VARCHAR(50),
    jadwal VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guru_id) REFERENCES guru(id) ON DELETE SET NULL
);

-- ======================================================
-- TABEL guru
-- ======================================================
CREATE TABLE IF NOT EXISTS guru (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    jabatan VARCHAR(100),
    unit VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- TABEL delete_requests
-- ======================================================
CREATE TABLE IF NOT EXISTS delete_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    santri_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected','deleted') DEFAULT 'pending',
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Index untuk delete_requests
CREATE INDEX idx_delete_status ON delete_requests (status);
CREATE INDEX idx_delete_requested_by ON delete_requests (requested_by);
CREATE INDEX idx_delete_approved_at ON delete_requests (approved_at);

-- ======================================================
-- TABEL logs
-- ======================================================
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Index untuk logs
CREATE INDEX idx_logs_created_at ON logs (created_at);
CREATE INDEX idx_logs_user_id ON logs (user_id);
CREATE INDEX idx_logs_action ON logs (action);

-- ======================================================
-- TABEL notifications
-- ======================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type ENUM('success','info','warning','danger') DEFAULT 'info',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);