import express from 'express';
import authRoutes from './v1/authRoutes.js';
import v1 from './v1/index.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Login dan daftar harus tetap terbuka
router.use(authRoutes);

// Semua resource di bawah v1 wajib login
router.use(authenticate, v1);

export default router;