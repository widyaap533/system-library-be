import express from 'express';
import {
  getResourceTypes,
  getResourceType,
  addResourceType,
  editResourceType,
  removeResourceType
} from '../../../controllers/resourceTypeController.js';

const router = express.Router();

// Public routes
router.get('/resource-type', getResourceTypes);
router.get('/resource-type/:id', getResourceType);

// Protected routes
router.post('/resource-type', addResourceType);
router.put('/resource-type/:id', editResourceType);
router.delete('/resource-type/:id', removeResourceType);

export default router;
