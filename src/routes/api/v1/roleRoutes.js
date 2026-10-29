import express from 'express';
import {
  getRoles,
  getRole,
  addRole,
  editRole,
  removeRole
} from '../../../controllers/roleController.js';

const router = express.Router();

// Public routes
router.get('/role', getRoles);
router.get('/role/:id', getRole);

// Protected routes
router.post('/role', addRole);
router.put('/role/:id', editRole);
router.delete('/role/:id', removeRole);

export default router;
