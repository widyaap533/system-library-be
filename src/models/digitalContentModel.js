import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

const contentInclude = {
  book: {
    select: { id: true, bibid: true, title: true },
  },
};

export const getAllDigitalContents = async (bookId = "") => {
  try {
    return await prisma.digital_contents.findMany({
      where: {
        ...(bookId && { book_id: bookId }),
      },
      include: contentInclude,
      orderBy: { created_at: 'desc' },
    });
  } catch (error) {
    console.error("Error getting all digital contents:", error);
    throw error;
  }
};

export const getDigitalContentById = async (id) => {
  try {
    return await prisma.digital_contents.findFirst({
      where: { id: id },
      include: contentInclude,
    });
  } catch (error) {
    console.error("Error getting digital content by id:", error);
    throw error;
  }
};

export const createDigitalContent = async (data, userId) => {
  const { book_id, title, url, mime, size } = data;

  const id = uuidv4();

  try {
    return await prisma.digital_contents.create({
      data: {
        id: id,
        book_id: book_id,
        title: title,
        url: url,
        mime: mime || null,
        size: size ? parseInt(size) : null,
        created_by: userId,
        updated_by: userId,
      },
      include: contentInclude,
    });
  } catch (error) {
    console.error("Error creating digital content:", error);
    throw error;
  }
};

export const updateDigitalContent = async (id, data, userId) => {
  const { title, url, mime, size } = data;

  try {
    const result = await prisma.digital_contents.updateMany({
      where: { id: id },
      data: {
        ...(title !== undefined && { title: title }),
        ...(url !== undefined && { url: url }),
        ...(mime !== undefined && { mime: mime || null }),
        ...(size !== undefined && { size: size ? parseInt(size) : null }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating digital content:", error);
    throw error;
  }
};

export const deleteDigitalContent = async (id, userId) => {
  try {
    // Hard delete
    const result = await prisma.digital_contents.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting digital content:", error);
    throw error;
  }
};