import {
  getAllResourceTypes,
  getResourceTypeById,
  getResourceTypeByName,
  createResourceType,
  updateResourceType,
  deleteResourceType
} from '../models/resourceTypeModel.js';

export const getResourceTypes = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllResourceTypes(search);

    res.json({
      message: 'Data jenis sumber berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get resource types error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getResourceTypeById(id);

    if (!data) {
      return res.status(404).json({ message: 'Jenis sumber tidak ditemukan' });
    }

    res.json({
      message: 'Data jenis sumber berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get resource type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addResourceType = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama jenis sumber wajib diisi' });
    }

    const duplicate = await getResourceTypeByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama jenis sumber sudah digunakan' });
    }

    const newData = await createResourceType(data, userId);

    res.status(201).json({
      message: 'Jenis sumber berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add resource type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getResourceTypeById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Jenis sumber tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getResourceTypeByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama jenis sumber sudah digunakan' });
      }
    }

    const updated = await updateResourceType(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui jenis sumber' });
    }

    res.json({
      message: 'Jenis sumber berhasil diperbarui',
      data: await getResourceTypeById(id)
    });
  } catch (error) {
    console.error('Edit resource type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeResourceType = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getResourceTypeById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Jenis sumber tidak ditemukan' });
    }

    const deleted = await deleteResourceType(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus jenis sumber' });
    }

    res.json({ message: 'Jenis sumber berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove resource type error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
