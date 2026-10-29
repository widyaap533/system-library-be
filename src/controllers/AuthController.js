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
    const data = req.body;

    const required = [
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

    const missing = required.filter((field) => !data[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Beberapa field wajib belum diisi',
        fields: missing
      });
    }

    if (data.password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    if (data.nik.length !== 16) {
      return res.status(400).json({ message: 'NIK harus 16 digit' });
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
      return res.status(500).json({
        message: `Peran dengan kode "${DEFAULT_ROLE_CODE}" belum diatur. Jalankan seed terlebih dahulu.`
      });
    }

    // role_id dan member_id ditentukan server, bukan diambil dari body —
    // kalau tidak, siapa pun bisa mendaftar langsung sebagai admin
    // dan memilih nomor anggotanya sendiri.
    // Nomor anggota mengikuti format perpustakaan: L/P + tahun + urutan.
    const payload = {
      ...data,
      role_id: role.id,
      member_id: await generateMemberId(data.gender_id),
    };

    const newUser = await createUser(payload, 'system');

    res.status(201).json({
      message: 'Pendaftaran berhasil. Silakan login.',
      data: newUser
    });
  } catch (error) {
    if (
      error.code === 'GENDER_NOT_FOUND' ||
      error.code === 'GENDER_CODE_NOT_SET' ||
      error.code === 'GENDER_CODE_INVALID' ||
      error.code === 'SEQUENCE_EXHAUSTED' ||
      error.code === 'MEMBER_ID_COLLISION'
    ) {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email, NIK, atau nomor anggota sudah digunakan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Ada data relasi yang tidak valid' });
    }
    console.error('Register error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const user = await getUserByEmailWithPassword(email);

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