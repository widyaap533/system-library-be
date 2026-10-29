import {
  getAllPhysicalFormats,
  getPhysicalFormatById,
  getPhysicalFormatByName,
  createPhysicalFormat,
  updatePhysicalFormat,
  deletePhysicalFormat
} from '../models/physicalFormatModel.js';

export const getPhysicalFormats = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllPhysicalFormats(search);

    res.json({
      message: 'Data bentuk fisik berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get physical formats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getPhysicalFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getPhysicalFormatById(id);

    if (!data) {
      return res.status(404).json({ message: 'Bentuk fisik tidak ditemukan' });
    }

    res.json({
      message: 'Data bentuk fisik berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get physical format error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addPhysicalFormat = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama bentuk fisik wajib diisi' });
    }

    const duplicate = await getPhysicalFormatByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama bentuk fisik sudah digunakan' });
    }

    const newData = await createPhysicalFormat(data, userId);

    res.status(201).json({
      message: 'Bentuk fisik berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add physical format error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editPhysicalFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getPhysicalFormatById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Bentuk fisik tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getPhysicalFormatByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama bentuk fisik sudah digunakan' });
      }
    }

    const updated = await updatePhysicalFormat(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui bentuk fisik' });
    }

    res.json({
      message: 'Bentuk fisik berhasil diperbarui',
      data: await getPhysicalFormatById(id)
    });
  } catch (error) {
    console.error('Edit physical format error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removePhysicalFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getPhysicalFormatById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Bentuk fisik tidak ditemukan' });
    }

    const deleted = await deletePhysicalFormat(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus bentuk fisik' });
    }

    res.json({ message: 'Bentuk fisik berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove physical format error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
