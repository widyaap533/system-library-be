import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./src/config/prisma.js";
import passport from "./src/config/passport.js";
import mainRouter from "./src/routes/index.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Tanpa secret, JWT bisa dipalsukan siapa saja — lebih baik server
// menolak hidup daripada berjalan dengan keamanan bocor
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error(
    "JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET wajib diisi di .env"
  );
  process.exit(1);
}

// Global Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Membaca cookie httpOnly tempat refresh token disimpan
app.use(cookieParser());
app.use(passport.initialize());

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    message: "Book Lending System API is running",
    timestamp: new Date().toISOString(),
  });
});

// Test Database Connection via Prisma
app.get("/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      message: "Database connected successfully via Prisma Client",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Satu Pintu Routing API
app.use(mainRouter);

// 404 Handler — harus setelah semua route, sebelum error handler
app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan",
    path: req.originalUrl,
  });
});

// Global Error Handler — wajib 4 parameter, kalau tidak Express
// menganggapnya middleware biasa dan tidak pernah memanggilnya
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ message: "Data tidak valid", details: err.message });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Tidak memiliki akses" });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ message: "Data sudah ada (duplikat)" });
  }

  if (err.code === "P2003") {
    return res
      .status(400)
      .json({ message: "Data relasi tidak valid atau tidak ditemukan" });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ message: "Data tidak ditemukan" });
  }

  res.status(500).json({ message: "Terjadi kesalahan server" });
});

// Server Initialization
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Tutup koneksi database dengan rapi saat server dihentikan
const shutdown = async (signal) => {
  console.log(`\n${signal} diterima, menutup server...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server dan koneksi database ditutup");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;