import express from 'express';
import {
  getCategories,
  getCategory,
  addCategory,
  editCategory,
  removeCategory
} from '../../../controllers/categoryController.js';

const router = express.Router();

// Public routes
router.get('/category', getCategories);
router.get('/category/:id', getCategory);

// Protected routes
router.post('/category', addCategory);
router.put('/category/:id', editCategory);
router.delete('/category/:id', removeCategory);

export default router;
