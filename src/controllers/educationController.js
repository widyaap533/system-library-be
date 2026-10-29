import {
  getAllEducations,
  getEducationById,
  getEducationByName,
  createEducation,
  updateEducation,
  deleteEducation
} from '../models/educationModel.js';

export const getEducations = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllEducations(search);

    res.json({
      message: 'Data pendidikan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get educations error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getEducationById(id);

    if (!data) {
      return res.status(404).json({ message: 'Pendidikan tidak ditemukan' });
    }

    res.json({
      message: 'Data pendidikan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get education error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addEducation = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama pendidikan wajib diisi' });
    }

    const duplicate = await getEducationByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama pendidikan sudah digunakan' });
    }

    const newData = await createEducation(data, userId);

    res.status(201).json({
      message: 'Pendidikan berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getEducationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pendidikan tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getEducationByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama pendidikan sudah digunakan' });
      }
    }

    const updated = await updateEducation(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui pendidikan' });
    }

    res.json({
      message: 'Pendidikan berhasil diperbarui',
      data: await getEducationById(id)
    });
  } catch (error) {
    console.error('Edit education error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getEducationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pendidikan tidak ditemukan' });
    }

    const deleted = await deleteEducation(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus pendidikan' });
    }

    res.json({ message: 'Pendidikan berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove education error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
