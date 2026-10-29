import {
  getAllCopyStatuses,
  getCopyStatusById,
  getCopyStatusByName,
  getCopyStatusByCode,
  createCopyStatus,
  updateCopyStatus,
  deleteCopyStatus
} from '../models/copyStatusModel.js';

export const getCopyStatuses = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllCopyStatuses(search);

    res.json({
      message: 'Data status eksemplar berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get copy statuses error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getCopyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getCopyStatusById(id);

    if (!data) {
      return res.status(404).json({ message: 'Status eksemplar tidak ditemukan' });
    }

    res.json({
      message: 'Data status eksemplar berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get copy status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addCopyStatus = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama status eksemplar wajib diisi' });
    }

    const duplicate = await getCopyStatusByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama status eksemplar sudah digunakan' });
    }

    if (data.code) {
      const duplicateCode = await getCopyStatusByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode status eksemplar sudah digunakan' });
      }
    }

    const newData = await createCopyStatus(data, userId);

    res.status(201).json({
      message: 'Status eksemplar berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode status eksemplar sudah digunakan' });
    }
    console.error('Add copy status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editCopyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getCopyStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status eksemplar tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getCopyStatusByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama status eksemplar sudah digunakan' });
      }
    }

    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicateCode = await getCopyStatusByCode(data.code.toUpperCase());
      if (duplicateCode) {
        return res.status(409).json({ message: 'Kode status eksemplar sudah digunakan' });
      }
    }

    const updated = await updateCopyStatus(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui status eksemplar' });
    }

    res.json({
      message: 'Status eksemplar berhasil diperbarui',
      data: await getCopyStatusById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Kode status eksemplar sudah digunakan' });
    }
    console.error('Edit copy status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeCopyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getCopyStatusById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Status eksemplar tidak ditemukan' });
    }

    const deleted = await deleteCopyStatus(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus status eksemplar' });
    }

    res.json({ message: 'Status eksemplar berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove copy status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
