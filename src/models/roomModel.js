import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

// Lokasi Perpustakaan tidak disimpan di ruang, melainkan diambil
// dari perpustakaan induknya, jadi relasi ini selalu ikut dibawa
const roomInclude = {
  library: true,
};

export const getAllRooms = async (search = "", libraryId = "") => {
  try {
    return await prisma.rooms.findMany({
      where: {
        is_deleted: false,
        ...(libraryId && { library_id: libraryId }),
        ...(search && {
          name: { contains: search },
        }),
      },
      include: roomInclude,
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting all rooms:", error);
    throw error;
  }
};

export const getRoomById = async (id) => {
  try {
    return await prisma.rooms.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
      include: roomInclude,
    });
  } catch (error) {
    console.error("Error getting room by id:", error);
    throw error;
  }
};

// Nama ruang hanya perlu unik di dalam satu perpustakaan.
// "Ruang Baca Umum" boleh ada di dua gedung yang berbeda.
export const getRoomByName = async (name, libraryId) => {
  try {
    return await prisma.rooms.findFirst({
      where: {
        name: name,
        library_id: libraryId,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting room by name:", error);
    throw error;
  }
};

export const createRoom = async (data, userId) => {
  const { name, library_id } = data;

  const id = uuidv4();

  try {
    return await prisma.rooms.create({
      data: {
        id: id,
        name: name,
        library_id: library_id,
        created_by: userId,
        updated_by: userId,
      },
      include: roomInclude,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const updateRoom = async (id, data, userId) => {
  const { name, library_id } = data;

  try {
    const result = await prisma.rooms.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        ...(library_id !== undefined && { library_id: library_id }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
};

export const deleteRoom = async (id, userId) => {
  try {
    // book_copies sudah hard delete, jadi tanpa filter is_deleted
    const usedByCopies = await prisma.book_copies.count({
      where: { room_id: id },
    });

    if (usedByCopies > 0) {
      const error = new Error(
        `Ruang masih dipakai oleh ${usedByCopies} eksemplar. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete
    const result = await prisma.rooms.updateMany({
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
    console.error("Error deleting room:", error);
    throw error;
  }
};