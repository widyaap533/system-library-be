import express from 'express';
import {
  getGenders,
  getGender,
  addGender,
  editGender,
  removeGender
} from '../../../controllers/genderController.js';

const router = express.Router();

// Public routes
router.get('/gender', getGenders);
router.get('/gender/:id', getGender);

// Protected routes
router.post('/gender', addGender);
router.put('/gender/:id', editGender);
router.delete('/gender/:id', removeGender);

export default router;
