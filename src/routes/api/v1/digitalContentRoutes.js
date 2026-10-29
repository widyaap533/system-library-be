import express from 'express';
import {
  getDigitalContents,
  getDigitalContent,
  getDigitalContentsByBook,
  addDigitalContent,
  editDigitalContent,
  removeDigitalContent
} from '../../../controllers/digitalContentController.js';

const router = express.Router();

// Public routes
router.get('/digital-content/book/:bookId', getDigitalContentsByBook);
router.get('/digital-content', getDigitalContents);
router.get('/digital-content/:id', getDigitalContent);

// Protected routes
router.post('/digital-content', addDigitalContent);
router.put('/digital-content/:id', editDigitalContent);
router.delete('/digital-content/:id', removeDigitalContent);

export default router;
