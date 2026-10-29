import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllGenders = async (search = "") => {
  try {
    return await prisma.genders.findMany({
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
    console.error("Error getting all genders:", error);
    throw error;
  }
};

export const getGenderById = async (id) => {
  try {
    return await prisma.genders.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting gender by id:", error);
    throw error;
  }
};

export const getGenderByName = async (name) => {
  try {
    return await prisma.genders.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting gender by name:", error);
    throw error;
  }
};

// Kode dipakai logika program, jadi harus bisa dicari tersendiri
export const getGenderByCode = async (code) => {
  try {
    return await prisma.genders.findFirst({
      where: {
        code: code,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting gender by code:", error);
    throw error;
  }
};

export const createGender = async (data, userId) => {
  const { name, code } = data;

  const id = uuidv4();

  try {
    return await prisma.genders.create({
      data: {
        id: id,
        name: name,
        code: code ? code.toUpperCase() : null,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating gender:", error);
    throw error;
  }
};

export const updateGender = async (id, data, userId) => {
  const { name, code } = data;

  try {
    const result = await prisma.genders.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        ...(code !== undefined && { code: code ? code.toUpperCase() : null }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating gender:", error);
    throw error;
  }
};

export const deleteGender = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.users.count({
      where: { gender_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} pengguna`);

      const error = new Error(
        `Jenis kelamin masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.genders.updateMany({
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
    console.error("Error deleting gender:", error);
    throw error;
  }
};