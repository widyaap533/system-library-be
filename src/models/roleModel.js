import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllRoles = async (search = "") => {
  try {
    return await prisma.roles.findMany({
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
    console.error("Error getting all roles:", error);
    throw error;
  }
};

export const getRoleById = async (id) => {
  try {
    return await prisma.roles.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting role by id:", error);
    throw error;
  }
};

export const getRoleByName = async (name) => {
  try {
    return await prisma.roles.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting role by name:", error);
    throw error;
  }
};

// Kode dipakai logika program, jadi harus bisa dicari tersendiri
export const getRoleByCode = async (code) => {
  try {
    return await prisma.roles.findFirst({
      where: {
        code: code,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting role by code:", error);
    throw error;
  }
};

export const createRole = async (data, userId) => {
  const { name, code } = data;

  const id = uuidv4();

  try {
    return await prisma.roles.create({
      data: {
        id: id,
        name: name,
        code: code ? code.toUpperCase() : null,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const updateRole = async (id, data, userId) => {
  const { name, code } = data;

  try {
    const result = await prisma.roles.updateMany({
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
    console.error("Error updating role:", error);
    throw error;
  }
};

export const deleteRole = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.users.count({
      where: { role_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} pengguna`);

      const error = new Error(
        `Peran masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.roles.updateMany({
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
    console.error("Error deleting role:", error);
    throw error;
  }
};