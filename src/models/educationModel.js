import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllEducations = async (search = "") => {
  try {
    return await prisma.educations.findMany({
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
    console.error("Error getting all educations:", error);
    throw error;
  }
};

export const getEducationById = async (id) => {
  try {
    return await prisma.educations.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting education by id:", error);
    throw error;
  }
};

export const getEducationByName = async (name) => {
  try {
    return await prisma.educations.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting education by name:", error);
    throw error;
  }
};

export const createEducation = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.educations.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating education:", error);
    throw error;
  }
};

export const updateEducation = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.educations.updateMany({
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
    console.error("Error updating education:", error);
    throw error;
  }
};

export const deleteEducation = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.users.count({
      where: { education_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} pengguna`);

      const error = new Error(
        `Pendidikan masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.educations.updateMany({
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
    console.error("Error deleting education:", error);
    throw error;
  }
};