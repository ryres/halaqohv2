const pool = require('../../config/database');
const quran = require('holy-quran');

const surahsData = quran.HolyQuranHafsVersion.map(s => ({
  name: s.name,
  ayahs: s.numberOfVerses
}));

exports.list = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = ['nama', 'kelas', 'guru'].includes(req.query.sort) ? req.query.sort : 'nama';
    const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const sortColumn = { nama: 's.nama', kelas: 's.kelas', guru: 'g.nama' }[sort];
    const where = [];
    const queryParams = [];

    where.push('s.is_deleted = 0');

    if (search) {
      where.push('(s.nama LIKE ? OR s.kelas LIKE ? OR g.nama LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    const [rows] = await pool.query(`SELECT SQL_CALC_FOUND_ROWS s.*, h.nama_halaqoh AS halaqoh_nama, g.nama AS guru_nama FROM santri s LEFT JOIN halaqoh h ON s.halaqoh_id = h.id LEFT JOIN guru g ON s.guru_id = g.id ${whereClause} ORDER BY ${sortColumn} ${order}, s.id DESC LIMIT ? OFFSET ?`, [...queryParams, limit, offset]);
    const [[{ 'FOUND_ROWS()': total }]] = await pool.query('SELECT FOUND_ROWS()');
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh WHERE is_deleted = 0');
    const [gurus] = await pool.query('SELECT * FROM guru WHERE is_deleted = 0');

    res.render('master/santri', {
      santris: rows, 
      halaqohs,
      gurus,
      surahsData,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      search,
      sort,
      order: order.toLowerCase(),
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.render('master/santri', { santris: [], halaqohs: [], gurus: [], surahsData: [], currentPage: 1, totalPages: 1, totalCount: 0, search: '', sort: 'nama', order: 'asc', success: null, error: err.message });
  }
};

exports.create = async (req, res) => {
  const nama = typeof req.body.nama === 'string' ? req.body.nama.trim() : '';
  const kelas = typeof req.body.kelas === 'string' ? req.body.kelas.trim() : null;
  let { juz, surat, ayat_from, ayat_to, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  const parseNumber = value => value === undefined || value === null || String(value).trim() === '' ? null : Number(value);
  juz = parseNumber(juz);
  const ayatFrom = parseNumber(ayat_from);
  const ayatTo = parseNumber(ayat_to);
  tajwid = parseNumber(tajwid);
  kelancaran = parseNumber(kelancaran);
  makhraj = parseNumber(makhraj);
  target_juz = parseNumber(target_juz);
  surat = typeof surat === 'string' ? surat.trim() : '';
  halaqoh_id = typeof halaqoh_id === 'string' && halaqoh_id.trim() !== '' ? Number(halaqoh_id) : null;
  guru_id = typeof guru_id === 'string' && guru_id.trim() !== '' ? Number(guru_id) : null;

  const fieldErrors = {};
  const isInteger = value => Number.isInteger(value);
  if (!nama) fieldErrors.nama = 'Nama santri wajib diisi.';
  if (!isInteger(juz) || juz < 1 || juz > 30) fieldErrors.juz = 'Juz wajib dipilih dan harus berupa angka antara 1 dan 30.';
  if (!surat) fieldErrors.surat = 'Surat wajib dipilih.';
  if (!isInteger(ayatFrom) || ayatFrom < 1) fieldErrors.ayat_from = 'Ayat dari wajib dipilih dan harus berupa angka positif.';
  if (!isInteger(ayatTo) || ayatTo < 1) fieldErrors.ayat_to = 'Sampai ayat wajib dipilih dan harus berupa angka positif.';
  if (ayatFrom !== null && ayatTo !== null && ayatTo < ayatFrom) fieldErrors.ayat_to = 'Nilai Sampai Ayat tidak boleh lebih kecil dari Ayat dari.';
  if (!isInteger(tajwid) || tajwid < 0 || tajwid > 100) fieldErrors.tajwid = 'Nilai Tajwid wajib diisi dengan angka antara 0 dan 100.';
  if (!isInteger(kelancaran) || kelancaran < 0 || kelancaran > 100) fieldErrors.kelancaran = 'Nilai Kelancaran wajib diisi dengan angka antara 0 dan 100.';
  if (!isInteger(makhraj) || makhraj < 0 || makhraj > 100) fieldErrors.makhraj = 'Nilai Makhraj wajib diisi dengan angka antara 0 dan 100.';
  if (target_juz !== null && (!isInteger(target_juz) || target_juz < 1 || target_juz > 30)) fieldErrors.target_juz = 'Target Juz harus berupa angka antara 1 dan 30.';
  if (halaqoh_id !== null && (!isInteger(halaqoh_id) || halaqoh_id < 1)) fieldErrors.halaqoh_id = 'Halaqoh yang dipilih tidak valid.';
  if (guru_id !== null && (!isInteger(guru_id) || guru_id < 1)) fieldErrors.guru_id = 'Guru yang dipilih tidak valid.';

  const errorKeys = Object.keys(fieldErrors);
  if (errorKeys.length > 0) {
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh WHERE is_deleted = 0');
    const [gurus] = await pool.query('SELECT * FROM guru WHERE is_deleted = 0');
    return res.render('master/santri', {
      santris: [],
      halaqohs,
      gurus,
      surahsData,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      search: '',
      sort: 'nama',
      order: 'asc',
      success: null,
      error: null,
      modalOpen: true,
      formData: req.body,
      fieldErrors
    });
  }

  try {
    await pool.query('INSERT INTO santri (nama, kelas, juz, surat, ayat, setoran_tgl, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, user_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)',
      [nama, kelas, juz, surat, ayatTo, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz, req.session.userId]);
    req.session.flash = { type: 'success', message: 'Santri berhasil ditambahkan.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal menambah santri.' };
    res.redirect('/santri');
  }
};

exports.edit = async (req, res) => {
  const { id } = req.params;
  try {
    const [[santri]] = await pool.query('SELECT * FROM santri WHERE id = ? AND is_deleted = 0', [id]);
    const [halaqohs] = await pool.query('SELECT * FROM halaqoh WHERE is_deleted = 0');
    const [gurus] = await pool.query('SELECT * FROM guru WHERE is_deleted = 0');
    res.render('master/santri-form', { santri, halaqohs, gurus, surahsData, isEdit: true });
  } catch (err) {
    res.redirect('/santri?error=Data tidak ditemukan');
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  let { nama, kelas, juz, surat, ayat_from, ayat_to, tajwid, kelancaran, makhraj, halaqoh_id, guru_id, target_juz } = req.body;
  const parseNumber = value => value === undefined || value === null || String(value).trim() === '' ? null : Number(value);
  nama = typeof nama === 'string' ? nama.trim() : '';
  kelas = typeof kelas === 'string' ? kelas.trim() : null;
  juz = parseNumber(juz);
  const ayatFrom = parseNumber(ayat_from);
  const ayatTo = parseNumber(ayat_to);
  tajwid = parseNumber(tajwid);
  kelancaran = parseNumber(kelancaran);
  makhraj = parseNumber(makhraj);
  target_juz = parseNumber(target_juz);
  surat = typeof surat === 'string' ? surat.trim() : '';
  halaqoh_id = parseNumber(halaqoh_id);
  guru_id = parseNumber(guru_id);

  const errors = [];
  const isInteger = value => Number.isInteger(value);
  if (!nama) errors.push('Nama santri wajib diisi.');
  if (!isInteger(juz) || juz < 1 || juz > 30) errors.push('Juz wajib dipilih dan harus berupa angka antara 1 dan 30.');
  if (!surat) errors.push('Surat wajib dipilih.');
  if (!isInteger(ayatFrom) || ayatFrom < 1) errors.push('Ayat dari wajib dipilih dan harus berupa angka positif.');
  if (!isInteger(ayatTo) || ayatTo < 1) errors.push('Sampai ayat wajib dipilih dan harus berupa angka positif.');
  if (ayatFrom !== null && ayatTo !== null && ayatTo < ayatFrom) errors.push('Nilai Sampai Ayat tidak boleh lebih kecil dari Ayat dari.');
  if (!isInteger(tajwid) || tajwid < 0 || tajwid > 100) errors.push('Nilai Tajwid wajib diisi dengan angka antara 0 dan 100.');
  if (!isInteger(kelancaran) || kelancaran < 0 || kelancaran > 100) errors.push('Nilai Kelancaran wajib diisi dengan angka antara 0 dan 100.');
  if (!isInteger(makhraj) || makhraj < 0 || makhraj > 100) errors.push('Nilai Makhraj wajib diisi dengan angka antara 0 dan 100.');
  if (target_juz !== null && (!isInteger(target_juz) || target_juz < 1 || target_juz > 30)) errors.push('Target Juz harus berupa angka antara 1 dan 30.');
  if (halaqoh_id !== null && (!isInteger(halaqoh_id) || halaqoh_id < 1)) errors.push('Halaqoh yang dipilih tidak valid.');
  if (guru_id !== null && (!isInteger(guru_id) || guru_id < 1)) errors.push('Guru yang dipilih tidak valid.');

  if (errors.length > 0) {
    req.session.flash = { type: 'error', message: errors.join(' ') };
    return res.redirect('/santri');
  }
  try {
    await pool.query('UPDATE santri SET nama=?, kelas=?, juz=?, surat=?, ayat=?, setoran_tgl=NOW(), tajwid=?, kelancaran=?, makhraj=?, halaqoh_id=?, guru_id=?, target_juz=? WHERE id=?',
      [nama, kelas, juz, surat, ayatTo, tajwid, kelancaran, makhraj, halaqoh_id || null, guru_id || null, target_juz, id]);
    req.session.flash = { type: 'success', message: 'Santri berhasil diperbarui.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal memperbarui santri.' };
    res.redirect('/santri');
  }
};

exports.requestDelete = async (req, res) => {
  const { id } = req.params;
  try {
    const reason = req.body && req.body.reason ? req.body.reason : 'Diminta user';
    await pool.query('INSERT INTO delete_requests (santri_id, requested_by, reason) VALUES (?, ?, ?)', [id, req.session.userId, reason]);
    req.session.flash = { type: 'success', message: 'Permintaan penghapusan telah dikirim ke admin.' };
    res.redirect('/santri');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Gagal membuat permintaan penghapusan.' };
    res.redirect('/santri');
  }
};
