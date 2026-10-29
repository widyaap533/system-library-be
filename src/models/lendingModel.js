import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

// Aturan peminjaman — diambil dari .env supaya tidak perlu ubah kode
export const LOAN_DURATION_DAYS = parseInt(process.env.LOAN_DURATION_DAYS) || 7;
export const MAX_ACTIVE_LOANS = parseInt(process.env.MAX_ACTIVE_LOANS) || 3;

/**
 * Kode status yang dipakai logika sirkulasi.
 * Nama status boleh diubah pustakawan kapan saja, tapi kode ini tidak —
 * jadi logikanya tetap benar walaupun "Dipinjam" diganti "Sedang Dipinjam".
 */
export const COPY_STATUS = {
  AVAILABLE: 'TERSEDIA',
  BORROWED: 'DIPINJAM',
};

export const LOAN_STATUS = {
  ACTIVE: 'BERJALAN',
  RETURNED: 'DIKEMBALIKAN',
  OVERDUE: 'TERLAMBAT',
};

const loanInclude = {
  user: {
    select: {
      id: true,
      member_id: true,
      name: true,
      email: true,
      phone_number: true,
    },
  },
  loan_status: true,
  book_copy: {
    include: {
      book: {
        include: {
          authors: {
            include: { author: true },
            orderBy: { position: 'asc' },
          },
        },
      },
      room: { include: { library: true } },
      copy_status: true,
      access_type: true,
    },
  },
};

// Mencari status berdasarkan kode, dan memberi pesan yang jelas
// kalau kodenya belum diisi lewat menu master.
// copy_statuses dan loan_statuses masih soft delete, jadi is_deleted tetap dipakai.
const findCopyStatusByCode = async (code, tx = prisma) => {
  const status = await tx.copy_statuses.findFirst({
    where: { code: code, is_deleted: false },
  });

  if (!status) {
    const error = new Error(
      `Status eksemplar dengan kode "${code}" belum diatur. Isi kolom code di menu Status Eksemplar.`
    );
    error.code = "STATUS_NOT_CONFIGURED";
    throw error;
  }

  return status;
};

const findLoanStatusByCode = async (code, tx = prisma) => {
  const status = await tx.loan_statuses.findFirst({
    where: { code: code, is_deleted: false },
  });

  if (!status) {
    const error = new Error(
      `Status peminjaman dengan kode "${code}" belum diatur. Isi kolom code di menu Status Peminjaman.`
    );
    error.code = "STATUS_NOT_CONFIGURED";
    throw error;
  }

  return status;
};

const buildWhere = (search = "", filters = {}) => ({
  ...(filters.user_id && { user_id: filters.user_id }),
  ...(filters.book_copy_id && { book_copy_id: filters.book_copy_id }),
  ...(filters.loan_status_id && { loan_status_id: filters.loan_status_id }),
  ...(filters.active === 'true' && { return_date: null }),
  ...(filters.active === 'false' && { return_date: { not: null } }),
  ...(search && {
    OR: [
      { user: { name: { contains: search } } },
      { user: { member_id: { contains: search } } },
      { book_copy: { barcode: { contains: search } } },
      { book_copy: { book: { title: { contains: search } } } },
    ],
  }),
});

export const getAllLoans = async (limit = 10, offset = 0, search = "", filters = {}) => {
  try {
    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;

    return await prisma.loans.findMany({
      take: limitInt,
      skip: offsetInt,
      where: buildWhere(search, filters),
      include: loanInclude,
      orderBy: { borrow_date: 'desc' },
    });
  } catch (error) {
    console.error("Error getting all loans:", error);
    throw error;
  }
};

export const countLoans = async (search = "", filters = {}) => {
  try {
    return await prisma.loans.count({ where: buildWhere(search, filters) });
  } catch (error) {
    console.error("Error counting loans:", error);
    throw error;
  }
};

export const getLoanById = async (id) => {
  try {
    return await prisma.loans.findFirst({
      where: { id: id },
      include: loanInclude,
    });
  } catch (error) {
    console.error("Error getting loan by id:", error);
    throw error;
  }
};

export const getLoansByUser = async (userId, activeOnly = false) => {
  try {
    return await prisma.loans.findMany({
      where: {
        user_id: userId,
        ...(activeOnly && { return_date: null }),
      },
      include: loanInclude,
      orderBy: { borrow_date: 'desc' },
    });
  } catch (error) {
    console.error("Error getting loans by user:", error);
    throw error;
  }
};

export const countActiveLoansByUser = async (userId) => {
  try {
    return await prisma.loans.count({
      where: { user_id: userId, return_date: null },
    });
  } catch (error) {
    console.error("Error counting active loans:", error);
    throw error;
  }
};

export const getActiveLoanByCopy = async (bookCopyId) => {
  try {
    return await prisma.loans.findFirst({
      where: { book_copy_id: bookCopyId, return_date: null },
      include: loanInclude,
    });
  } catch (error) {
    console.error("Error getting active loan by copy:", error);
    throw error;
  }
};

export const getOverdueLoans = async () => {
  try {
    return await prisma.loans.findMany({
      where: {
        return_date: null,
        due_date: { lt: new Date() },
      },
      include: loanInclude,
      orderBy: { due_date: 'asc' },
    });
  } catch (error) {
    console.error("Error getting overdue loans:", error);
    throw error;
  }
};

/**
 * Peminjaman: membuat catatan pinjam sekaligus mengunci eksemplarnya.
 * Dua hal itu harus terjadi bersama — kalau status eksemplar gagal berubah,
 * buku yang sudah dibawa pulang akan tetap terlihat "Tersedia" di rak.
 */
export const borrowBook = async (data, userId) => {
  const { user_id, book_copy_id, notes, due_date } = data;

  const id = uuidv4();

  try {
    const borrowDate = new Date();
    const dueDate = due_date
      ? new Date(due_date)
      : new Date(borrowDate.getTime() + LOAN_DURATION_DAYS * 24 * 60 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      const borrowedStatus = await findCopyStatusByCode(COPY_STATUS.BORROWED, tx);
      const activeLoanStatus = await findLoanStatusByCode(LOAN_STATUS.ACTIVE, tx);

      const loan = await tx.loans.create({
        data: {
          id: id,
          borrow_date: borrowDate,
          due_date: dueDate,
          return_date: null,
          notes: notes || null,
          loan_status_id: activeLoanStatus.id,
          user_id: user_id,
          book_copy_id: book_copy_id,
          created_by: userId,
          updated_by: userId,
        },
        include: loanInclude,
      });

      await tx.book_copies.update({
        where: { id: book_copy_id },
        data: {
          copy_status_id: borrowedStatus.id,
          updated_by: userId,
        },
      });

      return loan;
    });
  } catch (error) {
    console.error("Error borrowing book:", error);
    throw error;
  }
};

/**
 * Pengembalian: mencatat tanggal kembali dan melepas eksemplarnya
 * kembali ke status tersedia, juga dalam satu transaksi.
 */
export const returnBook = async (loanId, data, userId) => {
  const { notes } = data || {};

  try {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loans.findFirst({
        where: { id: loanId },
      });

      if (!loan) {
        const error = new Error("Peminjaman tidak ditemukan");
        error.code = "NOT_FOUND";
        throw error;
      }

      if (loan.return_date) {
        const error = new Error("Buku ini sudah dikembalikan sebelumnya");
        error.code = "ALREADY_RETURNED";
        throw error;
      }

      const availableStatus = await findCopyStatusByCode(COPY_STATUS.AVAILABLE, tx);
      const returnedStatus = await findLoanStatusByCode(LOAN_STATUS.RETURNED, tx);

      const updated = await tx.loans.update({
        where: { id: loanId },
        data: {
          return_date: new Date(),
          loan_status_id: returnedStatus.id,
          ...(notes !== undefined && { notes: notes || null }),
          updated_by: userId,
        },
        include: loanInclude,
      });

      await tx.book_copies.update({
        where: { id: loan.book_copy_id },
        data: {
          copy_status_id: availableStatus.id,
          updated_by: userId,
        },
      });

      return updated;
    });
  } catch (error) {
    console.error("Error returning book:", error);
    throw error;
  }
};

// Memperpanjang tenggat tanpa membuat catatan pinjam baru
export const extendLoan = async (loanId, days, userId) => {
  try {
    const loan = await prisma.loans.findFirst({
      where: { id: loanId },
    });

    if (!loan) {
      const error = new Error("Peminjaman tidak ditemukan");
      error.code = "NOT_FOUND";
      throw error;
    }

    if (loan.return_date) {
      const error = new Error("Buku ini sudah dikembalikan, tidak bisa diperpanjang");
      error.code = "ALREADY_RETURNED";
      throw error;
    }

    const extraDays = parseInt(days) || LOAN_DURATION_DAYS;
    const newDueDate = new Date(
      loan.due_date.getTime() + extraDays * 24 * 60 * 60 * 1000
    );

    return await prisma.loans.update({
      where: { id: loanId },
      data: {
        due_date: newDueDate,
        updated_by: userId,
      },
      include: loanInclude,
    });
  } catch (error) {
    console.error("Error extending loan:", error);
    throw error;
  }
};

/**
 * Menandai semua peminjaman yang lewat tenggat jadi "Terlambat".
 * Dijalankan manual lewat endpoint, atau dijadwalkan harian nanti.
 */
export const markOverdueLoans = async (userId) => {
  try {
    const overdueStatus = await findLoanStatusByCode(LOAN_STATUS.OVERDUE);
    const activeStatus = await findLoanStatusByCode(LOAN_STATUS.ACTIVE);

    const result = await prisma.loans.updateMany({
      where: {
        return_date: null,
        due_date: { lt: new Date() },
        loan_status_id: activeStatus.id,
      },
      data: {
        loan_status_id: overdueStatus.id,
        updated_by: userId,
      },
    });

    return result.count;
  } catch (error) {
    console.error("Error marking overdue loans:", error);
    throw error;
  }
};

/**
 * Hard delete catatan peminjaman.
 *
 * Selama bukunya belum dikembalikan, penghapusan ditolak — kalau
 * catatannya hilang sementara buku masih di tangan peminjam,
 * eksemplarnya tertinggal berstatus "Dipinjam" tanpa jejak siapa
 * yang memegangnya.
 */
export const deleteLoan = async (id, userId) => {
  try {
    const loan = await prisma.loans.findFirst({ where: { id: id } });

    if (loan && !loan.return_date) {
      const error = new Error(
        "Peminjaman yang masih aktif tidak dapat dihapus. Kembalikan bukunya terlebih dahulu."
      );
      error.code = "IN_USE";
      throw error;
    }

    const result = await prisma.loans.deleteMany({ where: { id: id } });
    return result.count > 0;
  } catch (error) {
    console.error("Error deleting loan:", error);
    throw error;
  }
};

export const getLoanStats = async () => {
  try {
    const [total, active, overdue, returned] = await Promise.all([
      prisma.loans.count(),
      prisma.loans.count({ where: { return_date: null } }),
      prisma.loans.count({
        where: { return_date: null, due_date: { lt: new Date() } },
      }),
      prisma.loans.count({ where: { return_date: { not: null } } }),
    ]);

    return { total, active, overdue, returned };
  } catch (error) {
    console.error("Error getting loan stats:", error);
    throw error;
  }
};