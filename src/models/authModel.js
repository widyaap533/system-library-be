import prisma from '../config/prisma.js';

/**
 * Hal-hal yang khusus dipakai proses login, dipisah dari userModel
 * supaya fungsi yang menyentuh password dan refresh token berkumpul
 * di satu tempat dan mudah diaudit.
 */

export const saveRefreshToken = async (userId, token) => {
  try {
    const result = await prisma.users.updateMany({
      where: { id: userId },
      data: { refresh_token: token },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error saving refresh token:", error);
    throw error;
  }
};

export const clearRefreshToken = async (userId) => {
  try {
    const result = await prisma.users.updateMany({
      where: { id: userId },
      data: { refresh_token: null },
    });

    return result.count > 0;
  } catch (error) {
    console.error("Error clearing refresh token:", error);
    throw error;
  }
};

/**
 * Mencocokkan refresh token dengan yang tersimpan di database.
 *
 * Tidak cukup memeriksa tanda tangan JWT-nya saja: token yang sudah
 * dipakai logout harus langsung tidak berlaku, dan itu hanya bisa
 * diketahui dari database.
 */
export const findUserByRefreshToken = async (token) => {
  try {
    return await prisma.users.findFirst({
      where: { refresh_token: token },
      include: { role: true },
    });
  } catch (error) {
    console.error("Error finding user by refresh token:", error);
    throw error;
  }
};

export const getRoleByCode = async (code) => {
  try {
    return await prisma.roles.findFirst({
      where: { code: code, is_deleted: false },
    });
  } catch (error) {
    console.error("Error getting role by code:", error);
    throw error;
  }
};

// =====================================================================
// NOMOR ANGGOTA
// =====================================================================

/**
 * Format nomor anggota perpustakaan — 10 karakter:
 *
 *   P 2025 00899
 *   │  │     └── nomor urut pendaftar tahun itu, 5 digit
 *   │  └──────── tahun mendaftar, 4 digit
 *   └─────────── jenis kelamin: L atau P
 *
 * Contoh: P202500899 = perempuan, mendaftar 2025, pendaftar ke-899.
 *
 * Nomor urut dihitung per tahun dan dipakai bersama kedua jenis
 * kelamin — sesuai keterangan "anggota ke-899 yang mendaftar di
 * tahun 2025", bukan "perempuan ke-899".
 */
export const MEMBER_ID_LENGTH = 10;

const parseSequence = (memberId) => {
  // Lima karakter terakhir adalah nomor urutnya
  const tail = memberId.slice(5);
  const n = parseInt(tail, 10);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Mencari nomor urut tertinggi yang sudah terpakai pada satu tahun.
 *
 * Dibaca dari nomor anggota yang sudah ada, bukan dari jumlah baris,
 * supaya penghapusan anggota tidak membuat nomor terpakai ulang.
 */
export const getLastSequence = async (year, tx = prisma) => {
  const rows = await tx.users.findMany({
    where: {
      OR: [
        { member_id: { startsWith: `L${year}` } },
        { member_id: { startsWith: `P${year}` } },
      ],
    },
    select: { member_id: true },
  });

  if (rows.length === 0) return 0;

  return rows.reduce((max, row) => {
    const seq = parseSequence(row.member_id);
    return seq > max ? seq : max;
  }, 0);
};

/**
 * Membuat nomor anggota berikutnya.
 *
 * genderId dipakai untuk mengambil huruf depan. Huruf itu diambil dari
 * kolom code di tabel genders, bukan dari namanya — supaya mengubah
 * "Laki-laki" jadi "Pria" di menu master tidak merusak penomoran.
 */
export const generateMemberId = async (genderId, year = null) => {
  try {
    const gender = await prisma.genders.findFirst({
      where: { id: genderId, is_deleted: false },
    });

    if (!gender) {
      const error = new Error("Jenis kelamin tidak ditemukan");
      error.code = "GENDER_NOT_FOUND";
      throw error;
    }

    if (!gender.code) {
      const error = new Error(
        `Jenis kelamin "${gender.name}" belum punya kode (L atau P). Isi lewat menu Jenis Kelamin.`
      );
      error.code = "GENDER_CODE_NOT_SET";
      throw error;
    }

    const prefix = gender.code.toUpperCase();

    if (prefix !== 'L' && prefix !== 'P') {
      const error = new Error(
        `Kode jenis kelamin harus L atau P, sekarang "${prefix}".`
      );
      error.code = "GENDER_CODE_INVALID";
      throw error;
    }

    const targetYear = year || new Date().getFullYear();

    // Dicoba beberapa kali: dua pendaftaran yang hampir bersamaan
    // bisa membaca nomor urut terakhir yang sama
    for (let attempt = 1; attempt <= 10; attempt++) {
      const lastSequence = await getLastSequence(targetYear);
      const nextSequence = lastSequence + attempt;

      if (nextSequence > 99999) {
        const error = new Error(
          `Nomor urut anggota tahun ${targetYear} sudah penuh (maksimal 99999).`
        );
        error.code = "SEQUENCE_EXHAUSTED";
        throw error;
      }

      const candidate = `${prefix}${targetYear}${String(nextSequence).padStart(5, '0')}`;

      const taken = await prisma.users.findFirst({
        where: { member_id: candidate },
      });

      if (!taken) return candidate;
    }

    const error = new Error(
      "Gagal membuat nomor anggota setelah beberapa percobaan. Coba lagi."
    );
    error.code = "MEMBER_ID_COLLISION";
    throw error;
  } catch (error) {
    console.error("Error generating member id:", error);
    throw error;
  }
};

/**
 * Memeriksa apakah sebuah nomor anggota sesuai format.
 * Dipakai saat admin mengisi nomor secara manual.
 */
export const isValidMemberId = (memberId) => {
  return /^[LP]\d{9}$/.test(memberId);
};

/**
 * Membongkar nomor anggota jadi bagian-bagiannya.
 * Berguna untuk ditampilkan di halaman detail anggota.
 */
export const parseMemberId = (memberId) => {
  if (!isValidMemberId(memberId)) return null;

  return {
    gender_code: memberId.slice(0, 1),
    year: parseInt(memberId.slice(1, 5), 10),
    sequence: parseInt(memberId.slice(5), 10),
  };
};