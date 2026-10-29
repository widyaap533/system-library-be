import express from 'express';
import {
  getAuthors,
  getAuthor,
  addAuthor,
  editAuthor,
  removeAuthor
} from '../../../controllers/authorController.js';

const router = express.Router();

// Public routes
router.get('/author', getAuthors);
router.get('/author/:id', getAuthor);

// Protected routes
router.post('/author', addAuthor);
router.put('/author/:id', editAuthor);
router.delete('/author/:id', removeAuthor);

export default router;
