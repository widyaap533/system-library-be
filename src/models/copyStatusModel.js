import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllCopyStatuses = async (search = "") => {
  try {
    return await prisma.copy_statuses.findMany({
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
    console.error("Error getting all copy statuses:", error);
    throw error;
  }
};

export const getCopyStatusById = async (id) => {
  try {
    return await prisma.copy_statuses.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting copy status by id:", error);
    throw error;
  }
};

export const getCopyStatusByName = async (name) => {
  try {
    return await prisma.copy_statuses.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting copy status by name:", error);
    throw error;
  }
};

// Kode dipakai logika program, jadi harus bisa dicari tersendiri
export const getCopyStatusByCode = async (code) => {
  try {
    return await prisma.copy_statuses.findFirst({
      where: {
        code: code,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting copy status by code:", error);
    throw error;
  }
};

export const createCopyStatus = async (data, userId) => {
  const { name, code, is_available } = data;

  const id = uuidv4();

  try {
    return await prisma.copy_statuses.create({
      data: {
        id: id,
        name: name,
        code: code ? code.toUpperCase() : null,
        is_available: is_available ?? false,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating copy status:", error);
    throw error;
  }
};

export const updateCopyStatus = async (id, data, userId) => {
  const { name, code, is_available } = data;

  try {
    const result = await prisma.copy_statuses.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        ...(code !== undefined && { code: code ? code.toUpperCase() : null }),
        ...(is_available !== undefined && { is_available: is_available }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating copy status:", error);
    throw error;
  }
};

export const deleteCopyStatus = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.book_copies.count({
      where: { copy_status_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} eksemplar`);

      const error = new Error(
        `Status eksemplar masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.copy_statuses.updateMany({
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
    console.error("Error deleting copy status:", error);
    throw error;
  }
};