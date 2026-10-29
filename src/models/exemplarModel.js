import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

// Semua relasi yang dibutuhkan halaman eksemplar.
// Lokasi Perpustakaan ikut terbawa lewat room.library.
const exemplarInclude = {
  book: {
    include: {
      authors: {
        include: { author: true },
        orderBy: { position: 'asc' },
      },
    },
  },
  physical_format: true,
  resource_type: true,
  category: true,
  access_type: true,
  copy_status: true,
  room: {
    include: { library: true },
  },
};

/**
 * Merangkai kolom "Data Bibliografis" seperti di lembar Excel.
 * Isinya bukan kolom tersimpan, melainkan gabungan data katalog:
 *
 *   Kota di Titik Nol / H. Rusdy Mastura
 *   2009
 *   Palu : BAPPEDA-PM, 2009
 *   85 hlm : Ilus ; 21,5 x 24,3 cm
 */
export const formatBibliographic = (book) => {
  if (!book) return "";

  const authorNames = (book.authors || [])
    .map((ba) => ba.author?.name)
    .filter(Boolean)
    .join('; ');

  const lines = [];

  lines.push(authorNames ? `${book.title} / ${authorNames}` : book.title);

  if (book.publication_year) {
    lines.push(String(book.publication_year));
  }

  // "Palu : BAPPEDA-PM, 2009"
  const imprint = [
    book.publication_place,
    book.publisher ? `: ${book.publisher}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (imprint) {
    lines.push(book.publication_year ? `${imprint}, ${book.publication_year}` : imprint);
  }

  if (book.physical_description) {
    lines.push(book.physical_description);
  }

  return lines.join('\n');
};

// Menempelkan data_bibliografis ke hasil query supaya frontend
// tinggal menampilkan, tidak perlu merangkai sendiri
const withBibliographic = (copy) => {
  if (!copy) return copy;
  return { ...copy, data_bibliografis: formatBibliographic(copy.book) };
};

const buildWhere = (search = "", filters = {}) => ({
  ...(filters.book_id && { book_id: filters.book_id }),
  ...(filters.category_id && { category_id: filters.category_id }),
  ...(filters.room_id && { room_id: filters.room_id }),
  ...(filters.copy_status_id && { copy_status_id: filters.copy_status_id }),
  ...(filters.access_type_id && { access_type_id: filters.access_type_id }),
  ...(search && {
    OR: [
      { barcode: { contains: search } },
      { id_number: { contains: search } },
      { book: { title: { contains: search } } },
      { book: { bibid: { contains: search } } },
      { book: { call_number: { contains: search } } },
      {
        book: {
          authors: {
            some: {
              author: { name: { contains: search } },
            },
          },
        },
      },
    ],
  }),
});

export const getAllExemplars = async (limit = 10, offset = 0, search = "", filters = {}) => {
  try {
    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;

    const rows = await prisma.book_copies.findMany({
      take: limitInt,
      skip: offsetInt,
      where: buildWhere(search, filters),
      include: exemplarInclude,
      orderBy: { created_at: 'desc' },
    });

    return rows.map(withBibliographic);
  } catch (error) {
    console.error("Error getting all exemplars:", error);
    throw error;
  }
};

export const countExemplars = async (search = "", filters = {}) => {
  try {
    return await prisma.book_copies.count({
      where: buildWhere(search, filters),
    });
  } catch (error) {
    console.error("Error counting exemplars:", error);
    throw error;
  }
};

export const getExemplarById = async (id) => {
  try {
    const row = await prisma.book_copies.findFirst({
      where: { id: id },
      include: exemplarInclude,
    });

    return withBibliographic(row);
  } catch (error) {
    console.error("Error getting exemplar by id:", error);
    throw error;
  }
};

// Dipakai saat petugas memindai barcode di meja sirkulasi
export const getExemplarByBarcode = async (barcode) => {
  try {
    const row = await prisma.book_copies.findFirst({
      where: { barcode: barcode },
      include: exemplarInclude,
    });

    return withBibliographic(row);
  } catch (error) {
    console.error("Error getting exemplar by barcode:", error);
    throw error;
  }
};

export const getExemplarByIdNumber = async (idNumber) => {
  try {
    const row = await prisma.book_copies.findFirst({
      where: { id_number: idNumber },
      include: exemplarInclude,
    });

    return withBibliographic(row);
  } catch (error) {
    console.error("Error getting exemplar by id number:", error);
    throw error;
  }
};

// Isi tombol "Detail" di halaman katalog
export const getExemplarsByBook = async (bookId) => {
  try {
    const rows = await prisma.book_copies.findMany({
      where: { book_id: bookId },
      include: exemplarInclude,
      orderBy: { barcode: 'asc' },
    });

    return rows.map(withBibliographic);
  } catch (error) {
    console.error("Error getting exemplars by book:", error);
    throw error;
  }
};

export const getAvailableExemplarsByBook = async (bookId) => {
  try {
    const rows = await prisma.book_copies.findMany({
      where: {
        book_id: bookId,
        copy_status: { is_available: true },
        access_type: { is_borrowable: true },
      },
      include: exemplarInclude,
      orderBy: { barcode: 'asc' },
    });

    return rows.map(withBibliographic);
  } catch (error) {
    console.error("Error getting available exemplars by book:", error);
    throw error;
  }
};

export const createExemplar = async (data, userId) => {
  const {
    barcode,
    id_number,
    acquisition_date,
    opac_active,
    notes,
    book_id,
    physical_format_id,
    resource_type_id,
    category_id,
    access_type_id,
    copy_status_id,
    room_id,
  } = data;

  const id = uuidv4();

  try {
    const row = await prisma.book_copies.create({
      data: {
        id: id,
        barcode: barcode,
        id_number: id_number,
        acquisition_date: new Date(acquisition_date),
        opac_active: opac_active ?? true,
        notes: notes || null,
        book_id: book_id,
        physical_format_id: physical_format_id,
        resource_type_id: resource_type_id,
        category_id: category_id,
        access_type_id: access_type_id,
        copy_status_id: copy_status_id,
        room_id: room_id,
        created_by: userId,
        updated_by: userId,
      },
      include: exemplarInclude,
    });

    return withBibliographic(row);
  } catch (error) {
    console.error("Error creating exemplar:", error);
    throw error;
  }
};

export const updateExemplar = async (id, data, userId) => {
  const {
    barcode,
    id_number,
    acquisition_date,
    opac_active,
    notes,
    book_id,
    physical_format_id,
    resource_type_id,
    category_id,
    access_type_id,
    copy_status_id,
    room_id,
  } = data;

  try {
    const result = await prisma.book_copies.updateMany({
      where: { id: id },
      data: {
        ...(barcode !== undefined && { barcode: barcode }),
        ...(id_number !== undefined && { id_number: id_number }),
        ...(acquisition_date && { acquisition_date: new Date(acquisition_date) }),
        ...(opac_active !== undefined && { opac_active: opac_active }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(book_id !== undefined && { book_id: book_id }),
        ...(physical_format_id !== undefined && { physical_format_id: physical_format_id }),
        ...(resource_type_id !== undefined && { resource_type_id: resource_type_id }),
        ...(category_id !== undefined && { category_id: category_id }),
        ...(access_type_id !== undefined && { access_type_id: access_type_id }),
        ...(copy_status_id !== undefined && { copy_status_id: copy_status_id }),
        ...(room_id !== undefined && { room_id: room_id }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating exemplar:", error);
    throw error;
  }
};

// Dipakai sirkulasi dan perbaikan koleksi, tanpa menyentuh kolom lain
export const updateExemplarStatus = async (id, copyStatusId, userId) => {
  try {
    const result = await prisma.book_copies.updateMany({
      where: { id: id },
      data: {
        copy_status_id: copyStatusId,
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating exemplar status:", error);
    throw error;
  }
};

export const deleteExemplar = async (id, userId) => {
  try {
    // Hard delete. Riwayat peminjaman eksemplar ini ikut terhapus
    // lewat onDelete: Cascade di schema. Tidak ada status yang
    // tertinggal karena eksemplarnya sendiri juga hilang.
    const result = await prisma.book_copies.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting exemplar:", error);
    throw error;
  }
};

// Ringkasan untuk dashboard
export const getExemplarStats = async () => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.book_copies.count(),
      prisma.book_copies.groupBy({
        by: ['copy_status_id'],
        _count: { _all: true },
      }),
    ]);

    // copy_statuses masih soft delete, jadi filternya tetap dipakai
    const statuses = await prisma.copy_statuses.findMany({
      where: { is_deleted: false },
    });

    const detail = byStatus.map((row) => {
      const status = statuses.find((s) => s.id === row.copy_status_id);
      return {
        copy_status_id: row.copy_status_id,
        name: status?.name || 'Tidak diketahui',
        total: row._count._all,
      };
    });

    return { total: total, by_status: detail };
  } catch (error) {
    console.error("Error getting exemplar stats:", error);
    throw error;
  }
};