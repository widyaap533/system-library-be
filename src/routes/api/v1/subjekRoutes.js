import express from 'express';
import {
  getSubjects,
  getSubject,
  addSubject,
  editSubject,
  removeSubject
} from '../../../controllers/subjekController.js';

const router = express.Router();

// Public routes
router.get('/subject', getSubjects);
router.get('/subject/:id', getSubject);

// Protected routes
router.post('/subject', addSubject);
router.put('/subject/:id', editSubject);
router.delete('/subject/:id', removeSubject);

export default router;
