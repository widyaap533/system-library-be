import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

// Relasi yang selalu ikut diambil untuk satu judul buku
const bookInclude = {
  authors: {
    include: { author: true },
    orderBy: { position: 'asc' },
  },
  subjects: {
    include: { subject: true },
  },
  digital_contents: true,
  _count: {
    select: {
      book_copies: true,
      digital_contents: true,
    },
  },
};

const buildWhere = (search = "") => ({
  ...(search && {
    OR: [
      { title: { contains: search } },
      { bibid: { contains: search } },
      { call_number: { contains: search } },
      { publisher: { contains: search } },
      {
        authors: {
          some: {
            author: { name: { contains: search } },
          },
        },
      },
    ],
  }),
});

export const getAllBooks = async (limit = 10, offset = 0, search = "") => {
  try {
    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;

    return await prisma.books.findMany({
      take: limitInt,
      skip: offsetInt,
      where: buildWhere(search),
      include: bookInclude,
      orderBy: {
        created_at: 'desc',
      },
    });
  } catch (error) {
    console.error("Error getting all books:", error);
    throw error;
  }
};

export const countBooks = async (search = "") => {
  try {
    return await prisma.books.count({
      where: buildWhere(search),
    });
  } catch (error) {
    console.error("Error counting books:", error);
    throw error;
  }
};

export const getBookById = async (id) => {
  try {
    return await prisma.books.findFirst({
      where: { id: id },
      include: bookInclude,
    });
  } catch (error) {
    console.error("Error getting book by id:", error);
    throw error;
  }
};

export const getBookByBibid = async (bibid) => {
  try {
    return await prisma.books.findFirst({
      where: { bibid: bibid },
      include: bookInclude,
    });
  } catch (error) {
    console.error("Error getting book by bibid:", error);
    throw error;
  }
};

export const createBook = async (bookData, userId) => {
  const {
    bibid,
    title,
    edition,
    publication_place,
    publisher,
    publication_year,
    synopsis,
    physical_description,
    call_number,
    author_ids = [], // array id pengarang, urut sesuai urutan tampil
    subject_ids = [], // array id subjek
  } = bookData;

  const id = uuidv4();

  try {
    const newBook = await prisma.books.create({
      data: {
        id: id,
        bibid: bibid,
        title: title,
        edition: edition,
        publication_place: publication_place,
        publisher: publisher,
        publication_year: publication_year ? parseInt(publication_year) : null,
        synopsis: synopsis,
        physical_description: physical_description,
        call_number: call_number,
        created_by: userId,
        updated_by: userId,
        authors: {
          create: author_ids.map((authorId, index) => ({
            author_id: authorId,
            position: index + 1,
            created_by: userId,
            updated_by: userId,
          })),
        },
        subjects: {
          create: subject_ids.map((subjectId) => ({
            subject_id: subjectId,
            created_by: userId,
            updated_by: userId,
          })),
        },
      },
      include: bookInclude,
    });

    return newBook;
  } catch (error) {
    console.error("Error creating book:", error);
    throw error;
  }
};

export const updateBook = async (id, bookData, userId) => {
  const {
    bibid,
    title,
    edition,
    publication_place,
    publisher,
    publication_year,
    synopsis,
    physical_description,
    call_number,
    author_ids,
    subject_ids,
  } = bookData;

  try {
    // Satu transaksi: ubah data judul, lalu susun ulang pengarang & subjek
    await prisma.$transaction(async (tx) => {
      await tx.books.update({
        where: { id: id },
        data: {
          bibid: bibid,
          title: title,
          edition: edition,
          publication_place: publication_place,
          publisher: publisher,
          ...(publication_year !== undefined && {
            publication_year: publication_year ? parseInt(publication_year) : null,
          }),
          synopsis: synopsis,
          physical_description: physical_description,
          call_number: call_number,
          updated_by: userId,
        },
      });

      // Pengarang hanya disentuh kalau memang dikirim dari form
      if (Array.isArray(author_ids)) {
        await tx.book_authors.deleteMany({ where: { book_id: id } });
        if (author_ids.length > 0) {
          await tx.book_authors.createMany({
            data: author_ids.map((authorId, index) => ({
              book_id: id,
              author_id: authorId,
              position: index + 1,
              created_by: userId,
              updated_by: userId,
            })),
          });
        }
      }

      if (Array.isArray(subject_ids)) {
        await tx.book_subjects.deleteMany({ where: { book_id: id } });
        if (subject_ids.length > 0) {
          await tx.book_subjects.createMany({
            data: subject_ids.map((subjectId) => ({
              book_id: id,
              subject_id: subjectId,
              created_by: userId,
              updated_by: userId,
            })),
          });
        }
      }
    });

    return true;
  } catch (error) {
    console.error("Error updating book:", error);
    throw error;
  }
};

export const deleteBook = async (id, userId) => {
  try {
    // Hard delete. Eksemplar, kaitan pengarang, kaitan subjek, dan
    // konten digital ikut terhapus lewat onDelete: Cascade di schema.
    // Riwayat peminjaman eksemplar tersebut juga ikut.
    const result = await prisma.books.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
};

export const getBooksBySubject = async (subjectId) => {
  try {
    return await prisma.books.findMany({
      where: {
        subjects: {
          some: { subject_id: subjectId },
        },
      },
      include: bookInclude,
    });
  } catch (error) {
    console.error("Error getting books by subject:", error);
    throw error;
  }
};

export const getBooksByAuthor = async (authorId) => {
  try {
    return await prisma.books.findMany({
      where: {
        authors: {
          some: { author_id: authorId },
        },
      },
      include: bookInclude,
    });
  } catch (error) {
    console.error("Error getting books by author:", error);
    throw error;
  }
};