import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllAuthors = async (search = "") => {
  try {
    return await prisma.authors.findMany({
      where: {
        ...(search && {
          name: { contains: search },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting all authors:", error);
    throw error;
  }
};

export const getAuthorById = async (id) => {
  try {
    return await prisma.authors.findFirst({
      where: {
        id: id,
      },
    });
  } catch (error) {
    console.error("Error getting author by id:", error);
    throw error;
  }
};

export const getAuthorByName = async (name) => {
  try {
    return await prisma.authors.findFirst({
      where: {
        name: name,
      },
    });
  } catch (error) {
    console.error("Error getting author by name:", error);
    throw error;
  }
};

export const createAuthor = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.authors.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating author:", error);
    throw error;
  }
};

export const updateAuthor = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.authors.updateMany({
      where: {
        id: id,
      },
      data: {
        ...(name !== undefined && { name: name }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating author:", error);
    throw error;
  }
};

export const deleteAuthor = async (id, userId) => {
  try {
    // Hard delete. Kaitan ke buku di tabel book_authors ikut terhapus
    // lewat onDelete: Cascade — bukunya tetap ada, hanya nama
    // pengarang ini yang lepas dari daftar.
    const result = await prisma.authors.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting author:", error);
    throw error;
  }
};