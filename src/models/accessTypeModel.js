import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllAccessTypes = async (search = "") => {
  try {
    return await prisma.access_types.findMany({
      where: {
        is_deleted: false,
        ...(search && {
          name: { contains: search },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting all access types:", error);
    throw error;
  }
};

export const getAccessTypeById = async (id) => {
  try {
    return await prisma.access_types.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting access type by id:", error);
    throw error;
  }
};

export const getAccessTypeByName = async (name) => {
  try {
    return await prisma.access_types.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting access type by name:", error);
    throw error;
  }
};

export const createAccessType = async (data, userId) => {
  const { name, is_borrowable } = data;

  const id = uuidv4();

  try {
    return await prisma.access_types.create({
      data: {
        id: id,
        name: name,
        is_borrowable: is_borrowable ?? true,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating access type:", error);
    throw error;
  }
};

export const updateAccessType = async (id, data, userId) => {
  const { name, is_borrowable } = data;

  try {
    const result = await prisma.access_types.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        name: name,
        ...(is_borrowable !== undefined && { is_borrowable: is_borrowable }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating access type:", error);
    throw error;
  }
};

export const deleteAccessType = async (id, userId) => {
  try {
    const usedByCopies = await prisma.book_copies.count({
      where: { access_type_id: id },
    });

    const usedByCategories = await prisma.categories.count({
      where: { default_access_type_id: id, is_deleted: false },
    });

    if (usedByCopies > 0 || usedByCategories > 0) {
      const parts = [];
      if (usedByCopies > 0) parts.push(`${usedByCopies} eksemplar`);
      if (usedByCategories > 0) parts.push(`${usedByCategories} kategori`);

      const error = new Error(
        `Tipe akses masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    const result = await prisma.access_types.updateMany({
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
    console.error("Error deleting access type:", error);
    throw error;
  }
};
