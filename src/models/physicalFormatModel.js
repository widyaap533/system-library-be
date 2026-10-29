import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllPhysicalFormats = async (search = "") => {
  try {
    return await prisma.physical_formats.findMany({
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
    console.error("Error getting all physical formats:", error);
    throw error;
  }
};

export const getPhysicalFormatById = async (id) => {
  try {
    return await prisma.physical_formats.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting physical format by id:", error);
    throw error;
  }
};

export const getPhysicalFormatByName = async (name) => {
  try {
    return await prisma.physical_formats.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting physical format by name:", error);
    throw error;
  }
};

export const createPhysicalFormat = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.physical_formats.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating physical format:", error);
    throw error;
  }
};

export const updatePhysicalFormat = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.physical_formats.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating physical format:", error);
    throw error;
  }
};

export const deletePhysicalFormat = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.book_copies.count({
      where: { physical_format_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} eksemplar`);

      const error = new Error(
        `Bentuk fisik masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.physical_formats.updateMany({
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
    console.error("Error deleting physical format:", error);
    throw error;
  }
};