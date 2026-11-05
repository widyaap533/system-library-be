import jwt from 'jsonwebtoken';
import {
  saveRefreshToken,
  clearRefreshToken,
  findUserByRefreshToken,
  getRoleByCode,
  generateMemberId
} from '../models/authModel.js';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByNik,
  getUserByEmailWithPassword,
  verifyPassword
} from '../models/userModel.js';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const REFRESH_COOKIE_DAYS = parseInt(process.env.REFRESH_COOKIE_DAYS) || 7;

// Nama cookie tempat refresh token disimpan
const REFRESH_COOKIE = 'refresh_token';

/**
 * Pengaturan cookie refresh token.
 *
 * httpOnly  : JavaScript di halaman tidak bisa membacanya, jadi aman
 *             dari pencurian lewat XSS.
 * secure    : hanya dikirim lewat HTTPS. Dimatikan saat development
 *             karena localhost memakai HTTP biasa.
 * sameSite  : 'lax' cukup selama frontend dan backend satu domain
 *             (localhost:5173 ke localhost:5000 masih dihitung sama).
 *             Kalau nanti beda domain, isi 'none' di .env — dan itu
 *             mewajibkan HTTPS.
 * path      : cookie hanya ikut terkirim ke endpoint di bawah /auth,
 *             tidak ke seluruh API. Mengurangi peluang tercecer.
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  path: '/auth',
  maxAge: REFRESH_COOKIE_DAYS * 24 * 60 * 60 * 1000,
};

// Peran bawaan untuk siapa pun yang mendaftar sendiri.
// Admin dan pustakawan tidak pernah lahir dari pendaftaran publik —
// keduanya dibuat lewat POST /user oleh admin yang sudah login.
const DEFAULT_ROLE_CODE = 'ANGGOTA';

// Field yang boleh dikirim pengguna saat mendaftar.
// Field lain dari body (role_id, member_id, is_active, id, dll.) diabaikan.
const REGISTER_FIELDS = [
  'nik',
  'name',
  'email',
  'password',
  'place_of_birth',
  'date_of_birth',
  'address',
  'phone_number',
  'institution',
  'occupation_id',
  'marriage_id',
  'education_id',
  'religion_id',
  'gender_id'
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIK_REGEX = /^\d{16}$/;

// Kesalahan konfigurasi/data server saat membuat nomor anggota,
// bukan kesalahan input pengguna.
const SERVER_SIDE_MEMBER_ERRORS = [
  'GENDER_CODE_NOT_SET',
  'GENDER_CODE_INVALID',
  'SEQUENCE_EXHAUSTED'
];

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '');

// Email selalu dibandingkan dalam huruf kecil tanpa spasi,
// supaya "Budi@x.com" dan "budi@x.com" dianggap akun yang sama
const normalizeEmail = (email) => String(email).trim().toLowerCase();

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });

export const register = async (req, res) => {
  try {
    const body = req.body ?? {};

    // Ambil hanya field yang diizinkan, rapikan spasi pada string
    // (password tidak di-trim karena spasi bisa jadi bagian password)
    const data = {};
    for (const field of REGISTER_FIELDS) {
      const value = body[field];
      data[field] = typeof value === 'string' && field !== 'password'
        ? value.trim()
        : value;
    }

    const missing = REGISTER_FIELDS.filter((field) => isEmpty(data[field]));
    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Beberapa field wajib belum diisi',
        fields: missing
      });
    }

    // NIK disimpan sebagai string: 16 digit melebihi batas aman angka JavaScript,
    // dan angka 0 di depan bisa hilang kalau diperlakukan sebagai number.
    data.nik = String(data.nik);
    if (!NIK_REGEX.test(data.nik)) {
      return res.status(400).json({ message: 'NIK harus 16 digit angka' });
    }

    data.email = normalizeEmail(data.email);
    if (!EMAIL_REGEX.test(data.email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    if (typeof data.password !== 'string' || data.password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    if (Number.isNaN(Date.parse(data.date_of_birth))) {
      return res.status(400).json({ message: 'Tanggal lahir tidak valid (format: YYYY-MM-DD)' });
    }

    const duplicateEmail = await getUserByEmail(data.email);
    if (duplicateEmail) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const duplicateNik = await getUserByNik(data.nik);
    if (duplicateNik) {
      return res.status(409).json({ message: 'NIK sudah terdaftar' });
    }

    const role = await getRoleByCode(DEFAULT_ROLE_CODE);
    if (!role) {
      console.error(`Register error: peran "${DEFAULT_ROLE_CODE}" belum ada. Jalankan seed terlebih dahulu.`);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }

    // role_id dan member_id selalu ditentukan server, tidak pernah dari body,
    // supaya tidak ada yang bisa mendaftar sebagai admin atau memilih nomor anggota sendiri.
    // Nomor anggota mengikuti format perpustakaan: L/P + tahun + urutan.
    const payload = {
      ...data,
      role_id: role.id,
      member_id: await generateMemberId(data.gender_id)
    };

    const newUser = await createUser(payload, 'system');

    // Jangan pernah mengirim hash password ke client
    const { password, ...safeUser } = newUser;

    return res.status(201).json({
      message: 'Pendaftaran berhasil. Silakan login.',
      data: safeUser
    });
  } catch (error) {
    if (error.code === 'GENDER_NOT_FOUND') {
      return res.status(400).json({ message: 'Jenis kelamin tidak valid' });
    }
    if (error.code === 'MEMBER_ID_COLLISION') {
      return res.status(409).json({ message: 'Gagal membuat nomor anggota, silakan coba lagi' });
    }
    if (SERVER_SIDE_MEMBER_ERRORS.includes(error.code)) {
      console.error('Register error (konfigurasi nomor anggota):', error);
      return res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email, NIK, atau nomor anggota sudah digunakan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Ada data relasi yang tidak valid' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (isEmpty(email) || isEmpty(password)) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    // Disamakan dengan register: email disimpan dalam huruf kecil
    const user = await getUserByEmailWithPassword(normalizeEmail(email));

    // Pesan sengaja dibuat sama untuk email salah dan password salah,
    // supaya tidak bisa dipakai menebak email mana yang terdaftar
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const match = await verifyPassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken);

    // Refresh token tidak ikut di body — hanya di cookie httpOnly,
    // supaya tidak bisa dibaca JavaScript di halaman
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

    res.json({
      message: 'Login berhasil',
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          member_id: user.member_id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const refresh = async (req, res) => {
  try {
    // Sumber utama cookie. Body disediakan sebagai cadangan untuk
    // klien yang tidak menyimpan cookie, misalnya aplikasi mobile.
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Sesi tidak ditemukan, silakan login kembali' });
    }

    // Dua pemeriksaan, dan keduanya perlu:
    // tanda tangan membuktikan token tidak dipalsukan,
    // database membuktikan token belum dicabut lewat logout.
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
      return res.status(401).json({ message: 'Sesi tidak sah atau sudah kedaluwarsa' });
    }

    const user = await findUserByRefreshToken(refreshToken);
    if (!user || user.id !== payload.sub) {
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
      return res.status(401).json({ message: 'Sesi sudah tidak berlaku' });
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // Refresh token lama langsung diganti, jadi kalau ada yang mencuri
    // token lama, token itu sudah tidak berguna
    await saveRefreshToken(user.id, newRefreshToken);
    res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOptions);

    res.json({
      message: 'Token berhasil diperbarui',
      data: {
        access_token: accessToken,
      }
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await clearRefreshToken(userId);
    }

    // Opsi harus sama persis dengan saat dipasang (terutama path),
    // kalau tidak cookie-nya tidak akan terhapus
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({
      message: 'Data pengguna berhasil diambil',
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};