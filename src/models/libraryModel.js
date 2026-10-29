import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllLibraries = async (search = "") => {
  try {
    return await prisma.libraries.findMany({
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
    console.error("Error getting all libraries:", error);
    throw error;
  }
};

export const getLibraryById = async (id) => {
  try {
    return await prisma.libraries.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting library by id:", error);
    throw error;
  }
};

export const getLibraryByName = async (name) => {
  try {
    return await prisma.libraries.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting library by name:", error);
    throw error;
  }
};

export const createLibrary = async (data, userId) => {
  const { name, address } = data;

  const id = uuidv4();

  try {
    return await prisma.libraries.create({
      data: {
        id: id,
        name: name,
        address: address ?? null,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating library:", error);
    throw error;
  }
};

export const updateLibrary = async (id, data, userId) => {
  const { name, address } = data;

  try {
    const result = await prisma.libraries.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        name: name,
        ...(address !== undefined && { address: address }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating library:", error);
    throw error;
  }
};

export const deleteLibrary = async (id, userId) => {
  try {
    // Tidak boleh dihapus selama masih dipakai data lain
    const usage0 = await prisma.rooms.count({
      where: { library_id: id, is_deleted: false },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} ruang`);

      const error = new Error(
        `Perpustakaan masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    const result = await prisma.libraries.updateMany({
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
    console.error("Error deleting library:", error);
    throw error;
  }
};
