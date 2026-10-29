import {
  getAllAccessTypes,
  getAccessTypeById,
  getAccessTypeByName,
  createAccessType,
  updateAccessType,
  deleteAccessType
} from '../models/accessTypeModel.js';

export const getAccessTypes = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllAccessTypes(search);

    res.json({
      message: 'Data tipe akses berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get access types error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAccessTypeById(id);

    if (!data) {
      return res.status(404).json({ message: 'Tipe akses tidak ditemukan' });
    }

    res.json({
      message: 'Data tipe akses berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get access type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addAccessType = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama tipe akses wajib diisi' });
    }

    const duplicate = await getAccessTypeByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama tipe akses sudah digunakan' });
    }

    const newData = await createAccessType(data, userId);

    res.status(201).json({
      message: 'Tipe akses berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add access type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getAccessTypeById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Tipe akses tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getAccessTypeByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama tipe akses sudah digunakan' });
      }
    }

    const updated = await updateAccessType(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui tipe akses' });
    }

    res.json({
      message: 'Tipe akses berhasil diperbarui',
      data: await getAccessTypeById(id)
    });
  } catch (error) {
    console.error('Edit access type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeAccessType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getAccessTypeById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Tipe akses tidak ditemukan' });
    }

    const deleted = await deleteAccessType(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus tipe akses' });
    }

    res.json({ message: 'Tipe akses berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove access type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
