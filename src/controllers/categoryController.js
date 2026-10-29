import {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory
} from '../models/categoryModel.js';
import { getAccessTypeById } from '../models/accessTypeModel.js';

export const getCategories = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllCategories(search);

    res.json({
      message: 'Data kategori berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getCategoryById(id);

    if (!data) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    res.json({
      message: 'Data kategori berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addCategory = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama kategori wajib diisi' });
    }

    // Akses bawaan boleh kosong, tapi kalau diisi harus benar-benar ada
    if (data.default_access_type_id) {
      const accessType = await getAccessTypeById(data.default_access_type_id);
      if (!accessType) {
        return res.status(400).json({ message: 'Tipe akses tidak ditemukan' });
      }
    }

    const duplicate = await getCategoryByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama kategori sudah digunakan' });
    }

    const newData = await createCategory(data, userId);

    res.status(201).json({
      message: 'Kategori berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    if (data.default_access_type_id) {
      const accessType = await getAccessTypeById(data.default_access_type_id);
      if (!accessType) {
        return res.status(400).json({ message: 'Tipe akses tidak ditemukan' });
      }
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getCategoryByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama kategori sudah digunakan' });
      }
    }

    const updated = await updateCategory(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui kategori' });
    }

    res.json({
      message: 'Kategori berhasil diperbarui',
      data: await getCategoryById(id)
    });
  } catch (error) {
    console.error('Edit category error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getCategoryById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    }

    const deleted = await deleteCategory(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus kategori' });
    }

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove category error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
