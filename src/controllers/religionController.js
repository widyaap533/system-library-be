import {
  getAllReligions,
  getReligionById,
  getReligionByName,
  createReligion,
  updateReligion,
  deleteReligion
} from '../models/religionModel.js';

export const getReligions = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllReligions(search);

    res.json({
      message: 'Data agama berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get religions error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getReligion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getReligionById(id);

    if (!data) {
      return res.status(404).json({ message: 'Agama tidak ditemukan' });
    }

    res.json({
      message: 'Data agama berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get religion error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addReligion = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama agama wajib diisi' });
    }

    const duplicate = await getReligionByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama agama sudah digunakan' });
    }

    const newData = await createReligion(data, userId);

    res.status(201).json({
      message: 'Agama berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add religion error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editReligion = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getReligionById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Agama tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getReligionByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama agama sudah digunakan' });
      }
    }

    const updated = await updateReligion(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui agama' });
    }

    res.json({
      message: 'Agama berhasil diperbarui',
      data: await getReligionById(id)
    });
  } catch (error) {
    console.error('Edit religion error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeReligion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getReligionById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Agama tidak ditemukan' });
    }

    const deleted = await deleteReligion(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus agama' });
    }

    res.json({ message: 'Agama berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove religion error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
