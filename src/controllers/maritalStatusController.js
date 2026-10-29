import {
  getAllMaritalStatuses,
  getMaritalStatusById,
  getMaritalStatusByName,
  createMaritalStatus,
  updateMaritalStatus,
  deleteMaritalStatus
} from '../models/maritalStatusModel.js';

export const getMaritalStatuses = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllMaritalStatuses(search);

    res.json({
      message: 'Data status perkawinan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get marital statuses error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getMaritalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getMaritalStatusById(id);

    if (!data) {
      return res.status(404).json({ message: 'Status perkawinan tidak ditemukan' });
    }

    res.json({
      message: 'Data status perkawinan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get marital status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addMaritalStatus = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama status perkawinan wajib diisi' });
    }

    const duplicate = await getMaritalStatusByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama status perkawinan sudah digunakan' });
    }

    const newData = await createMaritalStatus(data, userId);

    res.status(201).json({
      message: 'Status perkawinan berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add marital status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editMaritalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getMaritalStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status perkawinan tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getMaritalStatusByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama status perkawinan sudah digunakan' });
      }
    }

    const updated = await updateMaritalStatus(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui status perkawinan' });
    }

    res.json({
      message: 'Status perkawinan berhasil diperbarui',
      data: await getMaritalStatusById(id)
    });
  } catch (error) {
    console.error('Edit marital status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeMaritalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getMaritalStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status perkawinan tidak ditemukan' });
    }

    const deleted = await deleteMaritalStatus(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus status perkawinan' });
    }

    res.json({ message: 'Status perkawinan berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove marital status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
