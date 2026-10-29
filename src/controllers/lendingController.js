import {
  getAllLoans,
  countLoans,
  getLoanById,
  getLoansByUser,
  countActiveLoansByUser,
  getActiveLoanByCopy,
  getOverdueLoans,
  borrowBook,
  returnBook,
  extendLoan,
  markOverdueLoans,
  deleteLoan,
  getLoanStats,
  MAX_ACTIVE_LOANS
} from '../models/lendingModel.js';
import { getExemplarById, getExemplarByBarcode } from '../models/exemplarModel.js';
import { getUserById } from '../models/userModel.js';

export const getLoans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      user_id = '',
      book_copy_id = '',
      loan_status_id = '',
      active = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { user_id, book_copy_id, loan_status_id, active };

    const [loans, total] = await Promise.all([
      getAllLoans(parseInt(limit), offset, search, filters),
      countLoans(search, filters)
    ]);

    res.json({
      message: 'Data peminjaman berhasil diambil',
      data: loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_page: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getLoanById(id);

    if (!data) {
      return res.status(404).json({ message: 'Peminjaman tidak ditemukan' });
    }

    res.json({
      message: 'Data peminjaman berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getUserLoans = async (req, res) => {
  try {
    const { userId } = req.params;
    const { active = 'false' } = req.query;

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    const data = await getLoansByUser(userId, active === 'true');

    res.json({
      message: 'Data peminjaman berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getOverdue = async (req, res) => {
  try {
    const data = await getOverdueLoans();

    res.json({
      message: 'Data peminjaman terlambat berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get overdue error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const getStats = async (req, res) => {
  try {
    const data = await getLoanStats();

    res.json({
      message: 'Statistik peminjaman berhasil diambil',
      data: data
    });
  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const borrow = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id || 'system';

    if (!data.user_id) {
      return res.status(400).json({ message: 'Anggota (user_id) wajib diisi' });
    }

    if (!data.book_copy_id && !data.barcode) {
      return res.status(400).json({
        message: 'Eksemplar wajib diisi, lewat book_copy_id atau barcode'
      });
    }

    // Petugas boleh memindai barcode, tidak harus tahu id-nya
    let exemplar;
    if (data.book_copy_id) {
      exemplar = await getExemplarById(data.book_copy_id);
    } else {
      exemplar = await getExemplarByBarcode(data.barcode);
      if (exemplar) data.book_copy_id = exemplar.id;
    }

    if (!exemplar) {
      return res.status(404).json({ message: 'Eksemplar tidak ditemukan' });
    }

    const user = await getUserById(data.user_id);
    if (!user) {
      return res.status(404).json({ message: 'Anggota tidak ditemukan' });
    }

    // Syarat 1: koleksi ini memang boleh dipinjam
    if (!exemplar.access_type?.is_borrowable) {
      return res.status(409).json({
        message: `Eksemplar ini tidak dapat dipinjam (${exemplar.access_type?.name || 'akses tidak diketahui'})`
      });
    }

    // Syarat 2: eksemplarnya sedang ada di rak
    if (!exemplar.copy_status?.is_available) {
      return res.status(409).json({
        message: `Eksemplar sedang tidak tersedia (status: ${exemplar.copy_status?.name || 'tidak diketahui'})`
      });
    }

    // Syarat 3: tidak sedang dipinjam orang lain.
    // Pengecekan terpisah dari status, karena status bisa saja
    // tidak sinkron kalau pernah diubah manual dari menu eksemplar.
    const existingLoan = await getActiveLoanByCopy(data.book_copy_id);
    if (existingLoan) {
      return res.status(409).json({
        message: `Eksemplar sedang dipinjam oleh ${existingLoan.user?.name || 'anggota lain'}`
      });
    }

    // Syarat 4: anggota belum melebihi batas pinjam
    const activeLoans = await countActiveLoansByUser(data.user_id);
    if (activeLoans >= MAX_ACTIVE_LOANS) {
      return res.status(409).json({
        message: `Anggota sudah meminjam ${activeLoans} buku. Batas maksimal ${MAX_ACTIVE_LOANS} buku.`
      });
    }

    const loan = await borrowBook(data, userId);

    res.status(201).json({
      message: 'Peminjaman berhasil dicatat',
      data: loan
    });
  } catch (error) {
    if (error.code === 'STATUS_NOT_CONFIGURED') {
      return res.status(500).json({ message: error.message });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Anggota atau eksemplar tidak valid' });
    }
    console.error('Borrow error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const returnLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const loan = await returnBook(id, req.body, userId);

    const isLate = loan.due_date < loan.return_date;

    res.json({
      message: isLate
        ? 'Pengembalian berhasil dicatat, namun melewati tenggat'
        : 'Pengembalian berhasil dicatat',
      is_late: isLate,
      data: loan
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'ALREADY_RETURNED') {
      return res.status(409).json({ message: error.message });
    }
    if (error.code === 'STATUS_NOT_CONFIGURED') {
      return res.status(500).json({ message: error.message });
    }
    console.error('Return error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const extend = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    const userId = req.user?.id || 'system';

    const loan = await extendLoan(id, days, userId);

    res.json({
      message: 'Tenggat peminjaman berhasil diperpanjang',
      data: loan
    });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ message: error.message });
    }
    if (error.code === 'ALREADY_RETURNED') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Extend loan error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const syncOverdue = async (req, res) => {
  try {
    const userId = req.user?.id || 'system';
    const count = await markOverdueLoans(userId);

    res.json({
      message: `${count} peminjaman ditandai terlambat`,
      data: { updated: count }
    });
  } catch (error) {
    if (error.code === 'STATUS_NOT_CONFIGURED') {
      return res.status(500).json({ message: error.message });
    }
    console.error('Sync overdue error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

export const removeLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'system';

    const existing = await getLoanById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Peminjaman tidak ditemukan' });
    }

    const deleted = await deleteLoan(id, userId);

    if (!deleted) {
      return res.status(400).json({ message: 'Gagal menghapus peminjaman' });
    }

    res.json({ message: 'Peminjaman berhasil dihapus' });
  } catch (error) {
    if (error.code === 'IN_USE') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Remove loan error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
