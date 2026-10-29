import express from 'express';
import {
  getReligions,
  getReligion,
  addReligion,
  editReligion,
  removeReligion
} from '../../../controllers/religionController.js';

const router = express.Router();

// Public routes
router.get('/religion', getReligions);
router.get('/religion/:id', getReligion);

// Protected routes
router.post('/religion', addReligion);
router.put('/religion/:id', editReligion);
router.delete('/religion/:id', removeReligion);

export default router;
