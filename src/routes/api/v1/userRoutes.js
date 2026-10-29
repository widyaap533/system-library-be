import express from 'express';
import {
  getUsers,
  getUser,
  addUser,
  editUser,
  editPassword,
  removeUser
} from '../../../controllers/userController.js';

const router = express.Router();

// Public routes
// Daftar pengguna bisa disaring per peran: /user?role_id=xxx
router.get('/user', getUsers);
router.get('/user/:id', getUser);

// Protected routes
router.post('/user', addUser);
router.put('/user/:id', editUser);
router.put('/user/:id/password', editPassword);
router.delete('/user/:id', removeUser);

export default router;
