// import mysql from 'mysql2/promise';
// import dotenv from 'dotenv';

// dotenv.config();

// const dbConfig = {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// };

// const pool = mysql.createPool(dbConfig);

// export const getConnection = async () => {
//   try {
//     return await pool.getConnection();
//   } catch (error) {
//     console.error('Database connection error:', error);
//     throw error;
//   }
// };

// export default pool;
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export default prisma;