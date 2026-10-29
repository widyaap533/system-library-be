import express from 'express';
import {
  getCopyStatuses,
  getCopyStatus,
  addCopyStatus,
  editCopyStatus,
  removeCopyStatus
} from '../../../controllers/copyStatusController.js';

const router = express.Router();

// Public routes
router.get('/copy-status', getCopyStatuses);
router.get('/copy-status/:id', getCopyStatus);

// Protected routes
router.post('/copy-status', addCopyStatus);
router.put('/copy-status/:id', editCopyStatus);
router.delete('/copy-status/:id', removeCopyStatus);

export default router;
