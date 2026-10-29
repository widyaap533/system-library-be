import express from 'express';
import {
  getAccessTypes,
  getAccessType,
  addAccessType,
  editAccessType,
  removeAccessType
} from '../../../controllers/accessTypeController.js';

const router = express.Router();

// Public routes
router.get('/access-type', getAccessTypes);
router.get('/access-type/:id', getAccessType);

// Protected routes
router.post('/access-type', addAccessType);
router.put('/access-type/:id', editAccessType);
router.delete('/access-type/:id', removeAccessType);

export default router;
