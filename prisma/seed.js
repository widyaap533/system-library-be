import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Id tetap untuk kolom created_by/updated_by pada data hasil seed.
// Kolom itu tidak punya foreign key, jadi tidak harus menunjuk pengguna
// yang benar-benar ada — ini memecah masalah ayam-telur: admin pertama
// dibuat oleh "seseorang", padahal belum ada siapa-siapa.
const SEEDER_ID = "00000000-0000-0000-0000-000000000000";

const audit = {
  created_by: SEEDER_ID,
  updated_by: SEEDER_ID,
};

/**
 * Membuat baris kalau belum ada, dicocokkan lewat kode.
 * Dibuat idempoten supaya seed boleh dijalankan berkali-kali
 * tanpa menggandakan data yang sudah kamu isi lewat Postman.
 */
const ensureByCode = async (model, { code, name, extra = {} }) => {
  const existingByCode = await prisma[model].findFirst({ where: { code } });
  if (existingByCode) return existingByCode;

  // Baris lama yang dibuat sebelum kolom code ada: lengkapi kodenya
  const existingByName = await prisma[model].findFirst({
    where: { name, is_deleted: false },
  });

  if (existingByName) {
    return await prisma[model].update({
      where: { id: existingByName.id },
      data: { code, ...extra, updated_by: SEEDER_ID },
    });
  }

  return await prisma[model].create({
    data: { id: uuidv4(), name, code, ...extra, ...audit },
  });
};

const ensureByName = async (model, name) => {
  const existing = await prisma[model].findFirst({
    where: { name, is_deleted: false },
  });

  if (existing) return existing;

  return await prisma[model].create({
    data: { id: uuidv4(), name, ...audit },
  });
};

async function main() {
  console.log("Menyiapkan data awal...\n");

  // --- Peran ---------------------------------------------------------
  const roleAdmin = await ensureByCode("roles", { code: "ADMIN", name: "Admin" });
  await ensureByCode("roles", { code: "PUSTAKAWAN", name: "Pustakawan" });
  await ensureByCode("roles", { code: "ANGGOTA", name: "Anggota" });
  console.log("Peran siap: ADMIN, PUSTAKAWAN, ANGGOTA");

  // --- Jenis kelamin --------------------------------------------------
  // Kode L dan P jadi huruf depan nomor anggota, jadi wajib ada
  const genderL = await ensureByCode("genders", { code: "L", name: "Laki-laki" });
  await ensureByCode("genders", { code: "P", name: "Perempuan" });
  console.log("Jenis kelamin siap: L, P");

  // --- Status eksemplar ----------------------------------------------
  await ensureByCode("copy_statuses", {
    code: "TERSEDIA", name: "Tersedia", extra: { is_available: true },
  });
  await ensureByCode("copy_statuses", {
    code: "DIPINJAM", name: "Dipinjam", extra: { is_available: false },
  });
  await ensureByCode("copy_statuses", {
    code: "RUSAK", name: "Rusak", extra: { is_available: false },
  });
  await ensureByCode("copy_statuses", {
    code: "HILANG", name: "Hilang", extra: { is_available: false },
  });
  console.log("Status eksemplar siap");

  // --- Status peminjaman ----------------------------------------------
  await ensureByCode("loan_statuses", {
    code: "BERJALAN", name: "Berjalan", extra: { is_active: true },
  });
  await ensureByCode("loan_statuses", {
    code: "TERLAMBAT", name: "Terlambat", extra: { is_active: true },
  });
  await ensureByCode("loan_statuses", {
    code: "DIKEMBALIKAN", name: "Dikembalikan", extra: { is_active: false },
  });
  console.log("Status peminjaman siap");

  // --- Data diri (dipakai sebagai nilai bawaan akun admin) ------------
  const religion = await ensureByName("religions", "Islam");
  const education = await ensureByName("educations", "S1");
  const occupation = await ensureByName("occupations", "PNS");
  const marriage = await ensureByName("marital_statuses", "Belum Kawin");

  // --- Akun admin ------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@perpustakaan.go.id";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin12345";

  const existingAdmin = await prisma.users.findFirst({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`\nAkun admin sudah ada: ${adminEmail} (${existingAdmin.member_id})`);
  } else {
    // Nomor anggota admin mengikuti format yang sama dengan anggota biasa,
    // supaya tidak ada dua gaya penomoran di satu kolom.
    // Dipasang di urutan 00001 tahun berjalan.
    const year = new Date().getFullYear();
    const adminMemberId = `L${year}00001`;

    const taken = await prisma.users.findFirst({
      where: { member_id: adminMemberId },
    });

    if (taken) {
      console.log(
        `\nNomor ${adminMemberId} sudah terpakai. Admin dilewati — buat manual lewat POST /user.`
      );
    } else {
      await prisma.users.create({
        data: {
          id: uuidv4(),
          member_id: adminMemberId,
          nik: process.env.ADMIN_NIK || "7271010101900001",
          name: process.env.ADMIN_NAME || "Administrator",
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 10),
          place_of_birth: "Palu",
          date_of_birth: new Date("1990-01-01"),
          address: "-",
          phone_number: "-",
          institution: "Perpustakaan Kota Palu",
          role_id: roleAdmin.id,
          gender_id: genderL.id,
          religion_id: religion.id,
          education_id: education.id,
          occupation_id: occupation.id,
          marriage_id: marriage.id,
          ...audit,
        },
      });

      console.log("\nAkun admin dibuat:");
      console.log(`  nomor    : ${adminMemberId}`);
      console.log(`  email    : ${adminEmail}`);
      console.log(`  password : ${adminPassword}`);
      console.log("  Segera ganti password ini setelah login pertama.");
    }
  }

  console.log("\nSeed selesai.");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
