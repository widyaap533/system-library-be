import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllResourceTypes = async (search = "") => {
  try {
    return await prisma.resource_types.findMany({
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
    console.error("Error getting all resource types:", error);
    throw error;
  }
};

export const getResourceTypeById = async (id) => {
  try {
    return await prisma.resource_types.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting resource type by id:", error);
    throw error;
  }
};

export const getResourceTypeByName = async (name) => {
  try {
    return await prisma.resource_types.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting resource type by name:", error);
    throw error;
  }
};

export const createResourceType = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.resource_types.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating resource type:", error);
    throw error;
  }
};

export const updateResourceType = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.resource_types.updateMany({
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
    console.error("Error updating resource type:", error);
    throw error;
  }
};

export const deleteResourceType = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.book_copies.count({
      where: { resource_type_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} eksemplar`);

      const error = new Error(
        `Jenis sumber masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.resource_types.updateMany({
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
    console.error("Error deleting resource type:", error);
    throw error;
  }
};