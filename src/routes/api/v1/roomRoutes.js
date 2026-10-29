import express from 'express';
import {
  getRooms,
  getRoom,
  addRoom,
  editRoom,
  removeRoom
} from '../../../controllers/roomController.js';

const router = express.Router();

// Public routes
// Daftar ruang bisa disaring per perpustakaan: /room?library_id=xxx
router.get('/room', getRooms);
router.get('/room/:id', getRoom);

// Protected routes
router.post('/room', addRoom);
router.put('/room/:id', editRoom);
router.delete('/room/:id', removeRoom);

export default router;
