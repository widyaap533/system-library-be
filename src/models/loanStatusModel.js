import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";

export const getAllLoanStatuses = async (search = "") => {
  try {
    return await prisma.loan_statuses.findMany({
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
    console.error("Error getting all loan statuses:", error);
    throw error;
  }
};

export const getLoanStatusById = async (id) => {
  try {
    return await prisma.loan_statuses.findFirst({
      where: {
        id: id,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting loan status by id:", error);
    throw error;
  }
};

export const getLoanStatusByName = async (name) => {
  try {
    return await prisma.loan_statuses.findFirst({
      where: {
        name: name,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting loan status by name:", error);
    throw error;
  }
};

// Kode dipakai logika program, jadi harus bisa dicari tersendiri
export const getLoanStatusByCode = async (code) => {
  try {
    return await prisma.loan_statuses.findFirst({
      where: {
        code: code,
        is_deleted: false,
      },
    });
  } catch (error) {
    console.error("Error getting loan status by code:", error);
    throw error;
  }
};

export const createLoanStatus = async (data, userId) => {
  const { name, code, is_active } = data;

  const id = uuidv4();

  try {
    return await prisma.loan_statuses.create({
      data: {
        id: id,
        name: name,
        code: code ? code.toUpperCase() : null,
        is_active: is_active ?? true,
        created_by: userId,
        updated_by: userId,
      },
    });
  } catch (error) {
    console.error("Error creating loan status:", error);
    throw error;
  }
};

export const updateLoanStatus = async (id, data, userId) => {
  const { name, code, is_active } = data;

  try {
    const result = await prisma.loan_statuses.updateMany({
      where: {
        id: id,
        is_deleted: false,
      },
      data: {
        ...(name !== undefined && { name: name }),
        ...(code !== undefined && { code: code ? code.toUpperCase() : null }),
        ...(is_active !== undefined && { is_active: is_active }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating loan status:", error);
    throw error;
  }
};

export const deleteLoanStatus = async (id, userId) => {
  try {
    // Tabel master: tidak boleh dipensiunkan selama masih dipakai
    const usage0 = await prisma.loans.count({
      where: { loan_status_id: id },
    });

    if (usage0 > 0) {
      const parts = [];
      if (usage0 > 0) parts.push(`${usage0} peminjaman`);

      const error = new Error(
        `Status peminjaman masih dipakai oleh ${parts.join(' dan ')}. Tidak dapat dihapus.`
      );
      error.code = "IN_USE";
      throw error;
    }

    // Soft delete: barisnya tetap ada supaya data lama yang menunjuk
    // ke sini tidak rusak, tapi tidak lagi muncul di dropdown.
    const result = await prisma.loan_statuses.updateMany({
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
    console.error("Error deleting loan status:", error);
    throw error;
  }
};