import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllSubjects = async (search = "") => {
  try {
    return await prisma.subjects.findMany({
      where: {
        ...(search && {
          name: { contains: search },
        }),
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error("Error getting all subjects:", error);
    throw error;
  }
};

export const getSubjectById = async (id) => {
  try {
    return await prisma.subjects.findFirst({
      where: {
        id: id,
      },
    });
  } catch (error) {
    console.error("Error getting subject by id:", error);
    throw error;
  }
};

export const getSubjectByName = async (name) => {
  try {
    return await prisma.subjects.findFirst({
      where: {
        name: name,
      },
    });
  } catch (error) {
    console.error("Error getting subject by name:", error);
    throw error;
  }
};

export const createSubject = async (data, userId) => {
  const { name } = data;

  const id = uuidv4();

  try {
    return await prisma.subjects.create({
      data: {
        id: id,
        name: name,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating subject:", error);
    throw error;
  }
};

export const updateSubject = async (id, data, userId) => {
  const { name } = data;

  try {
    const result = await prisma.subjects.updateMany({
      where: {
        id: id,
      },
      data: {
        ...(name !== undefined && { name: name }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};

export const deleteSubject = async (id, userId) => {
  try {
    // Hard delete. Kaitan di tabel pivot ikut terhapus lewat
    // onDelete: Cascade yang diatur di schema.
    const result = await prisma.subjects.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};