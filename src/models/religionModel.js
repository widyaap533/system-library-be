import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllReligions = async (search = "") => {
  try {
    return await prisma.religions.findMany({
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
    console.error("Error getting all religions:", error);
    throw error;
  }
};

export const getReligionById = async (id) => {
  try {
    return await prisma.religions.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting religion by id:", error);
    throw error;
  }
};

export const getReligionByName = async (name) => {
  try {
    return await prisma.religions.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting religion by name:", error);
    throw error;
  }
};

export const createReligion = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.religions.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating religion:", error);
    throw error;
  }
};

export const updateReligion = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.religions.updateMany({
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
    console.error("Error updating religion:", error);
    throw error;
  }
};

export const deleteReligion = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.users.count({
      where: { religion_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} pengguna`);

      const error = new Error(
        `Agama masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.religions.updateMany({
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
    console.error("Error deleting religion:", error);
    throw error;
  }
};