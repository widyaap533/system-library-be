import {
  getAllGenders,
  getGenderById,
  getGenderByName,
  getGenderByCode,
  createGender,
  updateGender,
  deleteGender
} from '../models/genderModel.js';

export const getGenders = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllGenders(search);

    res.json({
      message: 'Data jenis kelamin berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get genders error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getGender = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getGenderById(id);

    if (!data) {
      return res.status(404).json({ message: 'Jenis kelamin tidak ditemukan' });
    }

    res.json({
      message: 'Data jenis kelamin berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get gender error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addGender = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama jenis kelamin wajib diisi' });
    }

    const duplicate = await getGenderByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama jenis kelamin sudah digunakan' });
    }

    if (data.code) {
      const duplicateCode = await getGenderByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode jenis kelamin sudah digunakan' });
      }
    }

    const newData = await createGender(data, userId);

    res.status(201).json({
      message: 'Jenis kelamin berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode jenis kelamin sudah digunakan' });
    }
    console.error('Add gender error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editGender = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getGenderById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Jenis kelamin tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getGenderByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama jenis kelamin sudah digunakan' });
      }
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicateCode = await getGenderByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode jenis kelamin sudah digunakan' });
      }
    }

    const updated = await updateGender(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui jenis kelamin' });
    }

    res.json({
      message: 'Jenis kelamin berhasil diperbarui',
      data: await getGenderById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode jenis kelamin sudah digunakan' });
    }
    console.error('Edit gender error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeGender = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getGenderById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Jenis kelamin tidak ditemukan' });
    }

    const deleted = await deleteGender(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus jenis kelamin' });
    }

    res.json({ message: 'Jenis kelamin berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove gender error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
