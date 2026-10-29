import express from 'express';
import {
  getMaritalStatuses,
  getMaritalStatus,
  addMaritalStatus,
  editMaritalStatus,
  removeMaritalStatus
} from '../../../controllers/maritalStatusController.js';

const router = express.Router();

// Public routes
router.get('/marital-status', getMaritalStatuses);
router.get('/marital-status/:id', getMaritalStatus);

// Protected routes
router.post('/marital-status', addMaritalStatus);
router.put('/marital-status/:id', editMaritalStatus);
router.delete('/marital-status/:id', removeMaritalStatus);

export default router;
