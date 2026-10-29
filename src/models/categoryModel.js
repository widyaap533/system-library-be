import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

// Akses bawaan ikut dibawa supaya form eksemplar bisa langsung
// mengisi dropdown Akses begitu Kategori dipilih
const categoryInclude = {
  default_access_type: true,
};

export const getAllCategories = async (search = "") => {
  try {
    return await prisma.categories.findMany({
      where: {
        is_deleted: false,
        ...(search && {
          name: { contains: search },
        }),
      },
      include: categoryInclude,
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting all categories:", error);
    throw error;
  }
};

export const getCategoryById = async (id) => {
  try {
    return await prisma.categories.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
      include: categoryInclude,
    });
  } catch (error) {
    console.error("Error getting category by id:", error);
    throw error;
  }
};

export const getCategoryByName = async (name) => {
  try {
    return await prisma.categories.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting category by name:", error);
    throw error;
  }
};

export const createCategory = async (data, userId) => {
  const { name, default_access_type_id } = data;

  const id = uuidv4();

  try {
    return await prisma.categories.create({
      data: {
        id: id,
        name: name,
        default_access_type_id: default_access_type_id || null,
        created_by: userId,
        updated_by: userId,
      },
      include: categoryInclude,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategory = async (id, data, userId) => {
  const { name, default_access_type_id } = data;

  try {
    const result = await prisma.categories.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        // Kirim null secara sengaja untuk menghapus akses bawaan
        ...(default_access_type_id !== undefined && {
          default_access_type_id: default_access_type_id || null,
        }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id, userId) => {
  try {
    // Kategori melekat pada eksemplar, bukan pada judul buku.
    // book_copies sudah hard delete, jadi tidak ada filter is_deleted di sini.
    const usedByCopies = await prisma.book_copies.count({
      where: { category_id: id },
    });

    if (usedByCopies > 0) {
      const error = new Error(
        `Kategori masih dipakai oleh ${usedByCopies} eksemplar. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.categories.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        is_deleted: true,
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};