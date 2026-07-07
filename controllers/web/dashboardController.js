const pool = require('../../config/database');
const xlsx = require('xlsx');
const fs = require('fs');

exports.index = async (req, res) => {
  try {
    const [santriRes] = await pool.query('SELECT COUNT(*) as total FROM santri');
    const [guruRes] = await pool.query('SELECT COUNT(*) as total FROM guru');
    const [halaqohRes] = await pool.query('SELECT COUNT(*) as total FROM halaqoh');
    const [clusterRes] = await pool.query('SELECT COUNT(*) as total FROM delete_requests WHERE status = "pending"');
    
    res.render('dashboard/index', {
      totalSantri: santriRes[0].total || 0,
      totalGuru: guruRes[0].total || 0,
      totalHalaqoh: halaqohRes[0].total || 0,
      totalDeleteRequests: clusterRes[0].total || 0
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard/index', { totalSantri: 0, totalGuru: 0, totalHalaqoh: 0, totalDeleteRequests: 0 });
  }
};

exports.dataset = (req, res) => {
  res.render('dashboard/dataset', {
    success: req.query.success || null,
    error: req.query.error || null
  });
};

exports.clustering = (req, res) => {
  res.render('dashboard/clustering');
};

exports.result = async (req, res) => {
  res.render('dashboard/result');
};

exports.importDataset = async (req, res) => {
  if (!req.file) {
    return res.redirect('/dataset?error=Silakan pilih file CSV/XLSX terlebih dahulu.');
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.redirect('/dataset?error=File kosong atau tidak memiliki data.');
    }

    const [halaqohs] = await pool.query('SELECT id, nama_halaqoh FROM halaqoh');
    const [gurus] = await pool.query('SELECT id, nama FROM guru');

    function findValue(row, keys) {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().trim().replace(/[\s_-]+/g, '');
        if (keys.includes(cleanKey)) {
          return row[key];
        }
      }
      return null;
    }

    function resolveHalaqoh(val, halaqohs) {
      if (!val) return null;
      if (typeof val === 'number') return val;
      const clean = String(val).toLowerCase().trim();
      if (/^\d+$/.test(clean)) return parseInt(clean);
      const found = halaqohs.find(h => h.nama_halaqoh.toLowerCase().trim() === clean);
      return found ? found.id : null;
    }

    function resolveGuru(val, gurus) {
      if (!val) return null;
      if (typeof val === 'number') return val;
      const clean = String(val).toLowerCase().trim();
      if (/^\d+$/.test(clean)) return parseInt(clean, 10);
      const found = gurus.find(g => g.nama.toLowerCase().trim() === clean);
      return found ? found.id : null;
    }

    function normalizeInteger(value, defaultValue = null) {
      if (value === null || value === undefined || String(value).trim() === '') return defaultValue;
      const normalized = Number(String(value).trim());
      return Number.isFinite(normalized) ? Math.trunc(normalized) : defaultValue;
    }

    let successCount = 0;
    const importErrors = [];
    let rowIndex = 0;
    for (const row of data) {
      rowIndex += 1;
      const nama = findValue(row, ['nama', 'name', 'namasantri', 'studentname']);
      if (!nama) {
        importErrors.push({ row: rowIndex, reason: 'Kolom nama tidak ditemukan atau kosong' });
        continue;
      }

      const kelas = findValue(row, ['kelas', 'class', 'grade']) || null;
      const juz = normalizeInteger(findValue(row, ['juz', 'juzs']), 0);
      const surat = findValue(row, ['surat', 'surah', 'sura']) || null;
      const ayat = normalizeInteger(findValue(row, ['ayat', 'verse']), 0);
      const tajwid = normalizeInteger(findValue(row, ['tajwid', 'nilai_tajwid']), 0);
      const kelancaran = normalizeInteger(findValue(row, ['kelancaran', 'nilai_kelancaran', 'lancar']), 0);
      const makhraj = normalizeInteger(findValue(row, ['makhraj', 'nilai_makhraj', 'makharij']), 0);
      let target_juz = normalizeInteger(findValue(row, ['target_juz', 'target', 'targetjuz']), 30);
      if (!Number.isInteger(target_juz) || target_juz < 1 || target_juz > 30) target_juz = 30;

      const rawHalaqoh = findValue(row, ['halaqoh_id', 'halaqohid', 'id_halaqoh', 'idhalaqoh', 'halaqoh']);
      const halaqoh_id = resolveHalaqoh(rawHalaqoh, halaqohs);

      const rawGuru = findValue(row, ['guru_id', 'guruid', 'id_guru', 'idguru', 'guru']);
      const guru_id = resolveGuru(rawGuru, gurus);

      const errors = [];
      if (!Number.isInteger(juz) || juz < 0 || juz > 30) errors.push(`juz harus integer 0-30, ditemukan '${findValue(row, ['juz', 'juzs'])}'`);
      if (!Number.isInteger(ayat) || ayat < 0) errors.push(`ayat harus integer >=0, ditemukan '${findValue(row, ['ayat', 'verse'])}'`);
      if (!Number.isInteger(tajwid) || tajwid < 0 || tajwid > 100) errors.push(`tajwid harus integer 0-100, ditemukan '${findValue(row, ['tajwid', 'nilai_tajwid'])}'`);
      if (!Number.isInteger(kelancaran) || kelancaran < 0 || kelancaran > 100) errors.push(`kelancaran harus integer 0-100, ditemukan '${findValue(row, ['kelancaran', 'nilai_kelancaran', 'lancar'])}'`);
      if (!Number.isInteger(makhraj) || makhraj < 0 || makhraj > 100) errors.push(`makhraj harus integer 0-100, ditemukan '${findValue(row, ['makhraj', 'nilai_makhraj', 'makharij'])}'`);

      if (errors.length > 0) {
        importErrors.push({ row: rowIndex, nama, reason: errors.join('; ') });
        continue;
      }

      const userId = req.session.userId || null;
      try {
        await pool.query(
          'INSERT INTO santri (nama, kelas, juz, surat, ayat, setoran_tgl, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)',
          [nama, kelas, juz, surat, ayat, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, userId]
        );
        successCount++;
      } catch (err) {
        importErrors.push({ row: rowIndex, nama, reason: err.message });
      }
    }

    // Clean up file
    fs.unlinkSync(req.file.path);

    // Audit log
    const action = `IMPORT DATASET`;
    const details = JSON.stringify({ filename: req.file.originalname, successCount, errors: importErrors.length });
    const ip = req.ip || req.connection.remoteAddress || null;
    await pool.query('INSERT INTO logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)', [req.session.userId, req.session.username, action, details, ip]);

    let message = `Berhasil mengimpor ${successCount} data santri.`;
    if (importErrors.length > 0) {
      message += ` Gagal ${importErrors.length} baris.`;
      console.error('Import dataset errors (first 10):', importErrors.slice(0, 10));
    }
    res.redirect(`/dataset?success=${encodeURIComponent(message)}`);
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.redirect(`/dataset?error=Gagal mengimpor dataset: ${encodeURIComponent(err.message)}`);
  }
};

exports.deleteDataset = async (req, res) => {
  try {
    await pool.query('DELETE FROM santri');
    const action = `DELETE ALL DATASET`;
    const details = JSON.stringify({ userId: req.session.userId, username: req.session.username, message: 'Semua data santri dihapus' });
    const ip = req.ip || req.connection.remoteAddress || null;
    await pool.query('INSERT INTO logs (user_id, username, action, details, ip_address) VALUES (?, ?, ?, ?, ?)', [req.session.userId, req.session.username, action, details, ip]);
    res.redirect('/dataset?success=Semua dataset santri berhasil dihapus.');
  } catch (err) {
    console.error(err);
    res.redirect(`/dataset?error=Gagal menghapus dataset: ${encodeURIComponent(err.message)}`);
  }
};
