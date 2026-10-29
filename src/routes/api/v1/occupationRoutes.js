import express from 'express';
import {
  getOccupations,
  getOccupation,
  addOccupation,
  editOccupation,
  removeOccupation
} from '../../../controllers/occupationController.js';

const router = express.Router();

// Public routes
router.get('/occupation', getOccupations);
router.get('/occupation/:id', getOccupation);

// Protected routes
router.post('/occupation', addOccupation);
router.put('/occupation/:id', editOccupation);
router.delete('/occupation/:id', removeOccupation);

export default router;
