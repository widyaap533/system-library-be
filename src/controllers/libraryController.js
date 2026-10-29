import {
  getAllLibraries,
  getLibraryById,
  getLibraryByName,
  createLibrary,
  updateLibrary,
  deleteLibrary
} from '../models/libraryModel.js';

export const getLibraries = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const data = await getAllLibraries(search);

    res.json({
      message: 'Data perpustakaan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get libraries error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getLibraryById(id);

    if (!data) {
      return res.status(404).json({ message: 'Perpustakaan tidak ditemukan' });
    }

    res.json({
      message: 'Data perpustakaan berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addLibrary = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name) {
      return res.status(400).json({ message: 'Nama perpustakaan wajib diisi' });
    }

    const duplicate = await getLibraryByName(data.name);
    if (duplicate) {
      return res.status(409).json({ message: 'Nama perpustakaan sudah digunakan' });
    }

    const newData = await createLibrary(data, userId);

    res.status(201).json({
      message: 'Perpustakaan berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add library error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getLibraryById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Perpustakaan tidak ditemukan' });
    }

    if (data.name && data.name !== existing.name) {
      const duplicate = await getLibraryByName(data.name);
      if (duplicate) {
        return res.status(409).json({ message: 'Nama perpustakaan sudah digunakan' });
      }
    }

    const updated = await updateLibrary(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui perpustakaan' });
    }

    res.json({
      message: 'Perpustakaan berhasil diperbarui',
      data: await getLibraryById(id)
    });
  } catch (error) {
    console.error('Edit library error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getLibraryById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Perpustakaan tidak ditemukan' });
    }

    const deleted = await deleteLibrary(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus perpustakaan' });
    }

    res.json({ message: 'Perpustakaan berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove library error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
