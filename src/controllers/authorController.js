import {
  getAllAuthors,
  getAuthorById,
  getAuthorByName,
  createAuthor,
  updateAuthor,
  deleteAuthor
} from '../models/authorModel.js';

export const getAuthors = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllAuthors(search);

    res.json({
      message: 'Data pengarang berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getAuthorById(id);

    if (!data) {
      return res.status(404).json({ message: 'Pengarang tidak ditemukan' });
    }

    res.json({
      message: 'Data pengarang berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get author error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addAuthor = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama pengarang wajib diisi' });
    }

    const duplicate = await getAuthorByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama pengarang sudah digunakan' });
    }

    const newData = await createAuthor(data, userId);

    res.status(201).json({
      message: 'Pengarang berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add author error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getAuthorById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pengarang tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getAuthorByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama pengarang sudah digunakan' });
      }
    }

    const updated = await updateAuthor(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui pengarang' });
    }

    res.json({
      message: 'Pengarang berhasil diperbarui',
      data: await getAuthorById(id)
    });
  } catch (error) {
    console.error('Edit author error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getAuthorById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Pengarang tidak ditemukan' });
    }

    const deleted = await deleteAuthor(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus pengarang' });
    }

    res.json({ message: 'Pengarang berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove author error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
