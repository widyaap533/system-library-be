import prisma from '../config/prisma.js';
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcryptjs';

// Daftar kolom yang boleh keluar dari API.
// password dan refresh_token sengaja tidak masuk sini supaya tidak
// pernah ikut terkirim ke frontend, walaupun lupa dihapus di controller.
const userSelect = {
  id: true,
  member_id: true,
  nik: true,
  name: true,
  email: true,
  place_of_birth: true,
  date_of_birth: true,
  address: true,
  phone_number: true,
  institution: true,
  role_id: true,
  occupation_id: true,
  marriage_id: true,
  education_id: true,
  religion_id: true,
  gender_id: true,
  created_at: true,
  created_by: true,
  updated_at: true,
  updated_by: true,
  role: true,
  occupation: true,
  marriage: true,
  education: true,
  religion: true,
  gender: true,
};

const buildWhere = (search = "", filters = {}) => ({
  ...(filters.role_id && { role_id: filters.role_id }),
  ...(search && {
    OR: [
      { name: { contains: search } },
      { member_id: { contains: search } },
      { nik: { contains: search } },
      { email: { contains: search } },
    ],
  }),
});

export const getAllUsers = async (limit = 10, offset = 0, search = "", filters = {}) => {
  try {
    const limitInt = parseInt(limit) || 10;
    const offsetInt = parseInt(offset) || 0;

    return await prisma.users.findMany({
      take: limitInt,
      skip: offsetInt,
      where: buildWhere(search, filters),
      select: userSelect,
      orderBy: { created_at: 'desc' },
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

export const countUsers = async (search = "", filters = {}) => {
  try {
    return await prisma.users.count({
      where: buildWhere(search, filters),
    });
  } catch (error) {
    console.error("Error counting users:", error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    return await prisma.users.findFirst({
      where: { id: id },
      select: userSelect,
    });
  } catch (error) {
    console.error("Error getting user by id:", error);
    throw error;
  }
};

/**
 * Hanya untuk proses login. Mengembalikan password terenkripsi,
 * jadi hasilnya tidak boleh dikirim langsung sebagai respons API.
 */
export const getUserByEmailWithPassword = async (email) => {
  try {
    return await prisma.users.findFirst({
      where: { email: email },
      include: { role: true },
    });
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    return await prisma.users.findFirst({
      where: { email: email },
      select: userSelect,
    });
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

export const getUserByMemberId = async (memberId) => {
  try {
    return await prisma.users.findFirst({
      where: { member_id: memberId },
      select: userSelect,
    });
  } catch (error) {
    console.error("Error getting user by member id:", error);
    throw error;
  }
};

export const getUserByNik = async (nik) => {
  try {
    return await prisma.users.findFirst({
      where: { nik: nik },
      select: userSelect,
    });
  } catch (error) {
    console.error("Error getting user by nik:", error);
    throw error;
  }
};

export const createUser = async (data, userId) => {
  const {
    member_id,
    nik,
    name,
    email,
    password,
    place_of_birth,
    date_of_birth,
    address,
    phone_number,
    institution,
    role_id,
    occupation_id,
    marriage_id,
    education_id,
    religion_id,
    gender_id,
  } = data;

  const id = uuidv4();

  try {
    // Password tidak pernah disimpan apa adanya
    const hashedPassword = await bcrypt.hash(password, 10);

    return await prisma.users.create({
      data: {
        id: id,
        member_id: member_id,
        nik: nik,
        name: name,
        email: email,
        password: hashedPassword,
        place_of_birth: place_of_birth,
        date_of_birth: new Date(date_of_birth),
        address: address,
        phone_number: phone_number,
        institution: institution,
        role_id: role_id,
        occupation_id: occupation_id,
        marriage_id: marriage_id,
        education_id: education_id,
        religion_id: religion_id,
        gender_id: gender_id,
        created_by: userId,
        updated_by: userId,
      },
      select: userSelect,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (id, data, userId) => {
  const {
    member_id,
    nik,
    name,
    email,
    place_of_birth,
    date_of_birth,
    address,
    phone_number,
    institution,
    role_id,
    occupation_id,
    marriage_id,
    education_id,
    religion_id,
    gender_id,
  } = data;

  try {
    // Password sengaja tidak ikut di sini — ada changePassword sendiri,
    // supaya tidak bisa diganti diam-diam lewat form edit profil
    const result = await prisma.users.updateMany({
      where: { id: id },
      data: {
        ...(member_id !== undefined && { member_id: member_id }),
        ...(nik !== undefined && { nik: nik }),
        ...(name !== undefined && { name: name }),
        ...(email !== undefined && { email: email }),
        ...(place_of_birth !== undefined && { place_of_birth: place_of_birth }),
        ...(date_of_birth && { date_of_birth: new Date(date_of_birth) }),
        ...(address !== undefined && { address: address }),
        ...(phone_number !== undefined && { phone_number: phone_number }),
        ...(institution !== undefined && { institution: institution }),
        ...(role_id !== undefined && { role_id: role_id }),
        ...(occupation_id !== undefined && { occupation_id: occupation_id }),
        ...(marriage_id !== undefined && { marriage_id: marriage_id }),
        ...(education_id !== undefined && { education_id: education_id }),
        ...(religion_id !== undefined && { religion_id: religion_id }),
        ...(gender_id !== undefined && { gender_id: gender_id }),
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
};

export const changePassword = async (id, newPassword, userId) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await prisma.users.updateMany({
      where: { id: id },
      data: {
        password: hashedPassword,
        updated_by: userId,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

/**
 * Hard delete. Riwayat peminjaman ikut terhapus lewat cascade.
 *
 * Tapi selama masih ada buku yang belum dikembalikan, penghapusan
 * ditolak. Dua alasannya: perpustakaan kehilangan jejak siapa yang
 * memegang buku itu, dan eksemplarnya akan tertinggal berstatus
 * "Dipinjam" selamanya karena catatan peminjamannya ikut hilang.
 */
export const deleteUser = async (id, userId) => {
  try {
    const activeLoans = await prisma.loans.count({
      where: {
        user_id: id,
        return_date: null,
      },
    });

    if (activeLoans > 0) {
      const error = new Error(
        `Pengguna masih memiliki ${activeLoans} peminjaman aktif. Kembalikan bukunya terlebih dahulu.`
      );
      error.code = "IN_USE";
      throw error;
    }

    const result = await prisma.users.deleteMany({
      where: { id: id },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};