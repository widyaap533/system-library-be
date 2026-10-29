import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me
} from '../../../controllers/AuthController.js';
import { authenticate } from '../../../middleware/auth.js';

const router = express.Router();

// Terbuka untuk umum
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Butuh login
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
