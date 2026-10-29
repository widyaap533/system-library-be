import {
  getAllUsers,
  countUsers,
  getUserById,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserByMemberId,
  getUserByNik,
  createUser,
  updateUser,
  changePassword,
  verifyPassword,
  deleteUser
} from '../models/userModel.js';
import { generateMemberId, isValidMemberId } from '../models/authModel.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role_id = '' } = req.query;
    const offset = (page - 1) * limit;

    const [users, total] = await Promise.all([
      getAllUsers(parseInt(limit), offset, search, { role_id }),
      countUsers(search, { role_id })
    ]);

    res.json({
      message: 'Data pengguna berhasil diambil',
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_page: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getUserById(id);

    if (!data) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    res.json({
      message: 'Data pengguna berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addUser = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    // member_id sengaja tidak wajib: kalau kosong dibuatkan otomatis
    // mengikuti format perpustakaan (L/P + tahun + 5 digit urutan)
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
      'role_id',
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
      return res.status(409).json({ message: 'Email sudah digunakan' });
    }

    const duplicateNik = await getUserByNik(data.nik);
    if (duplicateNik) {
      return res.status(409).json({ message: 'NIK sudah terdaftar' });
    }

    if (data.member_id) {
      // Admin boleh menentukan sendiri, misalnya saat memindahkan data
      // anggota lama, tapi formatnya tetap harus benar
      if (!isValidMemberId(data.member_id)) {
        return res.status(400).json({
          message: 'Format nomor anggota salah. Harus L atau P, diikuti tahun 4 digit dan nomor urut 5 digit. Contoh: P202500899'
        });
      }

      const duplicateMemberId = await getUserByMemberId(data.member_id);
      if (duplicateMemberId) {
        return res.status(409).json({ message: 'Nomor anggota sudah digunakan' });
      }
    } else {
      data.member_id = await generateMemberId(data.gender_id);
    }

    const newData = await createUser(data, userId);

    res.status(201).json({
      message: 'Pengguna berhasil ditambahkan',
      data: newData
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
    console.error('Add user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (data.email && data.email !== existing.email) {
      const duplicate = await getUserByEmail(data.email);
      if (duplicate) {
        return res.status(409).json({ message: 'Email sudah digunakan' });
      }
    }

    if (data.nik && data.nik !== existing.nik) {
      if (data.nik.length !== 16) {
        return res.status(400).json({ message: 'NIK harus 16 digit' });
      }
      const duplicate = await getUserByNik(data.nik);
      if (duplicate) {
        return res.status(409).json({ message: 'NIK sudah terdaftar' });
      }
    }

    if (data.member_id && data.member_id !== existing.member_id) {
      if (!isValidMemberId(data.member_id)) {
        return res.status(400).json({
          message: 'Format nomor anggota salah. Contoh yang benar: P202500899'
        });
      }

      const duplicate = await getUserByMemberId(data.member_id);
      if (duplicate) {
        return res.status(409).json({ message: 'Nomor anggota sudah digunakan' });
      }
    }

    const updated = await updateUser(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui pengguna' });
    }

    res.json({
      message: 'Pengguna berhasil diperbarui',
      data: await getUserById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email, NIK, atau nomor anggota sudah digunakan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Ada data relasi yang tidak valid' });
    }
    console.error('Edit user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { old_password, new_password } = req.body;
    const userId = req.user?.id || 'system';

    if (!new_password) {
      return res.status(400).json({ message: 'Password baru wajib diisi' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    // Password lama wajib dicocokkan kalau pengguna mengganti miliknya sendiri.
    // Admin yang mereset password orang lain tidak perlu tahu password lamanya.
    const isSelf = req.user?.id === id;
    if (isSelf) {
      if (!old_password) {
        return res.status(400).json({ message: 'Password lama wajib diisi' });
      }

      const withPassword = await getUserByEmailWithPassword(existing.email);
      const match = await verifyPassword(old_password, withPassword.password);

      if (!match) {
        return res.status(400).json({ message: 'Password lama tidak sesuai' });
      }
    }

    const updated = await changePassword(id, new_password, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal mengubah password' });
    }

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Edit password error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getUserById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const deleted = await deleteUser(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus pengguna' });
    }

    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove user error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
