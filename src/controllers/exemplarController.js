import {
  getAllExemplars,
  countExemplars,
  getExemplarById,
  getExemplarByBarcode,
  getExemplarByIdNumber,
  getExemplarsByBook,
  getAvailableExemplarsByBook,
  createExemplar,
  updateExemplar,
  updateExemplarStatus,
  deleteExemplar,
  getExemplarStats
} from '../models/exemplarModel.js';
import { getBookById } from '../models/bookModel.js';
import { getCategoryById } from '../models/categoryModel.js';
import { getRoomById } from '../models/roomModel.js';

export const getExemplars = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      book_id = '',
      category_id = '',
      room_id = '',
      copy_status_id = '',
      access_type_id = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { book_id, category_id, room_id, copy_status_id, access_type_id };

    const [exemplars, total] = await Promise.all([
      getAllExemplars(parseInt(limit), offset, search, filters),
      countExemplars(search, filters)
    ]);

    res.json({
      message: 'Data eksemplar berhasil diambil',
      data: exemplars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_page: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get exemplars error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getExemplar = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getExemplarById(id);

    if (!data) {
      return res.status(404).json({ message: 'Eksemplar tidak ditemukan' });
    }

    res.json({
      message: 'Data eksemplar berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get exemplar error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getExemplarByBarcodeHandler = async (req, res) => {
  try {
    const { barcode } = req.params;
    const data = await getExemplarByBarcode(barcode);

    if (!data) {
      return res.status(404).json({ message: 'Eksemplar dengan barcode tersebut tidak ditemukan' });
    }

    res.json({
      message: 'Data eksemplar berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get exemplar by barcode error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getExemplarsByBookHandler = async (req, res) => {
  try {
    const { bookId } = req.params;

    const book = await getBookById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const data = await getExemplarsByBook(bookId);

    res.json({
      message: 'Data eksemplar berhasil diambil',
      book: {
        id: book.id,
        bibid: book.bibid,
        title: book.title
      },
      data: data
    });
  } catch (error) {
    console.error('Get exemplars by book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getAvailableExemplarsByBookHandler = async (req, res) => {
  try {
    const { bookId } = req.params;
    const data = await getAvailableExemplarsByBook(bookId);

    res.json({
      message: 'Data eksemplar tersedia berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get available exemplars error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getStats = async (req, res) => {
  try {
    const data = await getExemplarStats();

    res.json({
      message: 'Statistik eksemplar berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get exemplar stats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addExemplar = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    const required = [
      'barcode',
      'id_number',
      'acquisition_date',
      'book_id',
      'physical_format_id',
      'resource_type_id',
      'category_id',
      'copy_status_id',
      'room_id'
    ];

    const missing = required.filter((field) => !data[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Beberapa field wajib belum diisi',
        fields: missing
      });
    }

    const book = await getBookById(data.book_id);
    if (!book) {
      return res.status(400).json({ message: 'Buku tidak ditemukan' });
    }

    const category = await getCategoryById(data.category_id);
    if (!category) {
      return res.status(400).json({ message: 'Kategori tidak ditemukan' });
    }

    const room = await getRoomById(data.room_id);
    if (!room) {
      return res.status(400).json({ message: 'Ruang tidak ditemukan' });
    }

    // Akses boleh dikosongkan; kalau begitu dipakai akses bawaan kategori
    if (!data.access_type_id) {
      if (!category.default_access_type_id) {
        return res.status(400).json({
          message: 'Akses wajib diisi karena kategori ini tidak punya akses bawaan'
        });
      }
      data.access_type_id = category.default_access_type_id;
    }

    const duplicateBarcode = await getExemplarByBarcode(data.barcode);
    if (duplicateBarcode) {
      return res.status(409).json({ message: 'Barcode sudah digunakan oleh eksemplar lain' });
    }

    const duplicateIdNumber = await getExemplarByIdNumber(data.id_number);
    if (duplicateIdNumber) {
      return res.status(409).json({ message: 'Nomor induk sudah digunakan oleh eksemplar lain' });
    }

    const newData = await createExemplar(data, userId);

    res.status(201).json({
      message: 'Eksemplar berhasil ditambahkan',
      data: newData
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Barcode atau nomor induk sudah digunakan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Ada data relasi yang tidak valid' });
    }
    console.error('Add exemplar error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editExemplar = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id || 'system';

    const existing = await getExemplarById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Eksemplar tidak ditemukan' });
    }

    if (data.barcode && data.barcode !== existing.barcode) {
      const duplicate = await getExemplarByBarcode(data.barcode);
      if (duplicate) {
        return res.status(409).json({ message: 'Barcode sudah digunakan oleh eksemplar lain' });
      }
    }

    if (data.id_number && data.id_number !== existing.id_number) {
      const duplicate = await getExemplarByIdNumber(data.id_number);
      if (duplicate) {
        return res.status(409).json({ message: 'Nomor induk sudah digunakan oleh eksemplar lain' });
      }
    }

    const updated = await updateExemplar(id, data, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui eksemplar' });
    }

    res.json({
      message: 'Eksemplar berhasil diperbarui',
      data: await getExemplarById(id)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Barcode atau nomor induk sudah digunakan' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Ada data relasi yang tidak valid' });
    }
    console.error('Edit exemplar error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editExemplarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { copy_status_id } = req.body;
    const userId = req.user?.id || 'system';

    if (!copy_status_id) {
      return res.status(400).json({ message: 'Status eksemplar (copy_status_id) wajib diisi' });
    }

    const existing = await getExemplarById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Eksemplar tidak ditemukan' });
    }

    const updated = await updateExemplarStatus(id, copy_status_id, userId);

    if (!updated) {
      return res.status(400).json({ message: 'Gagal memperbarui status eksemplar' });
    }

    res.json({
      message: 'Status eksemplar berhasil diperbarui',
      data: await getExemplarById(id)
    });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Status eksemplar tidak valid' });
    }
    console.error('Edit exemplar status error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeExemplar = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getExemplarById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Eksemplar tidak ditemukan' });
    }

    const deleted = await deleteExemplar(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus eksemplar' });
    }

    res.json({ message: 'Eksemplar berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove exemplar error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
