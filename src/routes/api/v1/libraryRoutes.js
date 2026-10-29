import express from 'express';
import {
  getLibraries,
  getLibrary,
  addLibrary,
  editLibrary,
  removeLibrary
} from '../../../controllers/libraryController.js';

const router = express.Router();

// Public routes
router.get('/library', getLibraries);
router.get('/library/:id', getLibrary);

// Protected routes
router.post('/library', addLibrary);
router.put('/library/:id', editLibrary);
router.delete('/library/:id', removeLibrary);

export default router;
