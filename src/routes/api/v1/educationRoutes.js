import express from 'express';
import {
  getEducations,
  getEducation,
  addEducation,
  editEducation,
  removeEducation
} from '../../../controllers/educationController.js';

const router = express.Router();

// Public routes
router.get('/education', getEducations);
router.get('/education/:id', getEducation);

// Protected routes
router.post('/education', addEducation);
router.put('/education/:id', editEducation);
router.delete('/education/:id', removeEducation);

export default router;
