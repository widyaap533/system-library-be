import {
  getAllBooks,
  countBooks,
  getBookById,
  getBookByBibid,
  createBook,
  updateBook,
  deleteBook,
  getBooksBySubject,
  getBooksByAuthor
} from '../models/bookModel.js';

export const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const [books, total] = await Promise.all([
      getAllBooks(parseInt(limit), offset, search),
      countBooks(search)
    ]);

    res.json({
      message: 'Data buku berhasil diambil',
      data: books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_page: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    res.json({
      message: 'Data buku berhasil diambil',
      data: book
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const addBook = async (req, res) => {
  try {
    const bookData = req.body;
    const userId = req.user?.id || 'system';

    if (!bookData.bibid || !bookData.title) {
      return res.status(400).json({ message: 'BIBID dan judul (title) wajib diisi' });
    }

    const duplicate = await getBookByBibid(bookData.bibid);
    if (duplicate) {
      return res.status(409).json({ message: 'BIBID sudah digunakan oleh buku lain' });
    }

    const newBook = await createBook(bookData, userId);

    res.status(201).json({
      message: 'Buku berhasil ditambahkan',
      data: newBook
    });
  } catch (error) {
    // Jaga-jaga kalau dua request masuk bersamaan dan lolos pengecekan di atas
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'BIBID sudah digunakan oleh buku lain' });
    }
    console.error('Add book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const editBook = async (req, res) => {
  try {
    const { id } = req.params;
    const bookData = req.body;
    const userId = req.user?.id || 'system';

    const existingBook = await getBookById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    if (bookData.bibid && bookData.bibid !== existingBook.bibid) {
      const duplicate = await getBookByBibid(bookData.bibid);
      if (duplicate) {
        return res.status(409).json({ message: 'BIBID sudah digunakan oleh buku lain' });
      }
    }

    await updateBook(id, bookData, userId);

    // Ambil ulang supaya yang dikembalikan data asli dari database,
    // bukan pantulan dari req.body
    const updatedBook = await getBookById(id);

    res.json({
      message: 'Buku berhasil diperbarui',
      data: updatedBook
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'BIBID sudah digunakan oleh buku lain' });
    }
    console.error('Edit book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeBook = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existingBook = await getBookById(id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Buku tidak ditemukan' });
    }

    const deleted = await deleteBook(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus buku' });
    }

    res.json({ message: 'Buku berhasil dihapus' });
  } catch (error) {
    if (error.code === 'HAS_ACTIVE_COPIES') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove book error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getBooksBySubjects = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const books = await getBooksBySubject(subjectId);

    res.json({
      message: 'Data buku berhasil diambil',
      data: books
    });
  } catch (error) {
    console.error('Get books by subject error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getBooksByAuthors = async (req, res) => {
  try {
    const { authorId } = req.params;
    const books = await getBooksByAuthor(authorId);

    res.json({
      message: 'Data buku berhasil diambil',
      data: books
    });
  } catch (error) {
    console.error('Get books by author error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
