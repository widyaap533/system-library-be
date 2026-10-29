import express from 'express';
import {
  getPhysicalFormats,
  getPhysicalFormat,
  addPhysicalFormat,
  editPhysicalFormat,
  removePhysicalFormat
} from '../../../controllers/physicalFormatController.js';

const router = express.Router();

// Public routes
router.get('/physical-format', getPhysicalFormats);
router.get('/physical-format/:id', getPhysicalFormat);

// Protected routes
router.post('/physical-format', addPhysicalFormat);
router.put('/physical-format/:id', editPhysicalFormat);
router.delete('/physical-format/:id', removePhysicalFormat);

export default router;
