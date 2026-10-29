import {
  getAllDigitalContents,
  getDigitalContentById,
  createDigitalContent,
  updateDigitalContent,
  deleteDigitalContent
} from '../models/digitalContentModel.js';
import { getBookById } from '../models/bookModel.js';

export const getDigitalContents = async (req, res) => {
  try {
    const { book_id = '' } = req.query;
    const data = await getAllDigitalContents(book_id);

    res.json({
      message: 'Data konten digital berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get digital contents error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getDigitalContent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getDigitalContentById(id);

    if (!data) {
      return res.status(404).json({ message: 'Konten digital tidak ditemukan' });
    }

    res.json({
      message: 'Data konten digital berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get digital content error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getDigitalContentsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await getBookById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const data = await getAllDigitalContents(bookId);

    res.json({
      message: 'Data konten digital berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get digital contents by book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addDigitalContent = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.book_id || !data.title || !data.url) {
      return res.status(400).json({
        message: 'Buku (book_id), judul, dan url wajib diisi'
      });
    }

    const book = await getBookById(data.book_id);
    if (!book) {
      return res.status(400).json({ message: 'Buku tidak ditemukan' });
    }

    const newData = await createDigitalContent(data, userId);

    res.status(201).json({
      message: 'Konten digital berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Buku tidak valid' });
    }
    console.error('Add digital content error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editDigitalContent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getDigitalContentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Konten digital tidak ditemukan' });
    }

    const updated = await updateDigitalContent(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui konten digital' });
    }

    res.json({
      message: 'Konten digital berhasil diperbarui',
      data: await getDigitalContentById(id)
    });
  } catch (error) {
    console.error('Edit digital content error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeDigitalContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getDigitalContentById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Konten digital tidak ditemukan' });
    }

    const deleted = await deleteDigitalContent(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus konten digital' });
    }

    res.json({ message: 'Konten digital berhasil dihapus' });
  } catch (error) {
    console.error('Remove digital content error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
