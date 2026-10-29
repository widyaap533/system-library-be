import {
  getAllOccupations,
  getOccupationById,
  getOccupationByName,
  createOccupation,
  updateOccupation,
  deleteOccupation
} from '../models/occupationModel.js';

export const getOccupations = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllOccupations(search);

    res.json({
      message: 'Data pekerjaan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get occupations error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getOccupation = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getOccupationById(id);

    if (!data) {
      return res.status(404).json({ message: 'Pekerjaan tidak ditemukan' });
    }

    res.json({
      message: 'Data pekerjaan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get occupation error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addOccupation = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama pekerjaan wajib diisi' });
    }

    const duplicate = await getOccupationByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama pekerjaan sudah digunakan' });
    }

    const newData = await createOccupation(data, userId);

    res.status(201).json({
      message: 'Pekerjaan berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add occupation error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editOccupation = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getOccupationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pekerjaan tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getOccupationByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama pekerjaan sudah digunakan' });
      }
    }

    const updated = await updateOccupation(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui pekerjaan' });
    }

    res.json({
      message: 'Pekerjaan berhasil diperbarui',
      data: await getOccupationById(id)
    });
  } catch (error) {
    console.error('Edit occupation error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeOccupation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getOccupationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pekerjaan tidak ditemukan' });
    }

    const deleted = await deleteOccupation(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus pekerjaan' });
    }

    res.json({ message: 'Pekerjaan berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove occupation error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
