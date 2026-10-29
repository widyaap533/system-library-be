import {
  getAllRooms,
  getRoomById,
  getRoomByName,
  createRoom,
  updateRoom,
  deleteRoom
} from '../models/roomModel.js';
import { getLibraryById } from '../models/libraryModel.js';

export const getRooms = async (req, res) => {
  try {
    const { search = '', library_id = '' } = req.query;
    const data = await getAllRooms(search, library_id);

    res.json({
      message: 'Data ruang berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getRoomById(id);

    if (!data) {
      return res.status(404).json({ message: 'Ruang tidak ditemukan' });
    }

    res.json({
      message: 'Data ruang berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addRoom = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.name || !data.library_id) {
      return res.status(400).json({
        message: 'Nama ruang dan perpustakaan (library_id) wajib diisi'
      });
    }

    // Dicek lebih dulu supaya pesannya jelas, bukan error foreign key mentah
    const library = await getLibraryById(data.library_id);
    if (!library) {
      return res.status(400).json({ message: 'Perpustakaan tidak ditemukan' });
    }

    const duplicate = await getRoomByName(data.name, data.library_id);
    if (duplicate) {
      return res.status(409).json({
        message: 'Nama ruang sudah digunakan di perpustakaan ini'
      });
    }

    const newData = await createRoom(data, userId);

    res.status(201).json({
      message: 'Ruang berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getRoomById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Ruang tidak ditemukan' });
    }

    if (data.library_id && data.library_id !== existing.library_id) {
      const library = await getLibraryById(data.library_id);
      if (!library) {
        return res.status(400).json({ message: 'Perpustakaan tidak ditemukan' });
      }
    }

    const targetLibraryId = data.library_id || existing.library_id;
    const targetName = data.name || existing.name;

    if (targetName !== existing.name || targetLibraryId !== existing.library_id) {
      const duplicate = await getRoomByName(targetName, targetLibraryId);
      if (duplicate && duplicate.id !== id) {
        return res.status(409).json({
          message: 'Nama ruang sudah digunakan di perpustakaan ini'
        });
      }
    }

    const updated = await updateRoom(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui ruang' });
    }

    res.json({
      message: 'Ruang berhasil diperbarui',
      data: await getRoomById(id)
    });
  } catch (error) {
    console.error('Edit room error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getRoomById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Ruang tidak ditemukan' });
    }

    const deleted = await deleteRoom(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus ruang' });
    }

    res.json({ message: 'Ruang berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove room error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
