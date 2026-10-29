import express from 'express';
import {
  getExemplars,
  getExemplar,
  getExemplarByBarcodeHandler,
  getExemplarsByBookHandler,
  getAvailableExemplarsByBookHandler,
  getStats,
  addExemplar,
  editExemplar,
  editExemplarStatus,
  removeExemplar
} from '../../../controllers/exemplarController.js';

const router = express.Router();

// Public routes
// Route yang lebih spesifik harus di atas '/exemplar/:id',
// kalau tidak 'stats' dan 'barcode' akan tertangkap sebagai :id
router.get('/exemplar/stats', getStats);
router.get('/exemplar/barcode/:barcode', getExemplarByBarcodeHandler);
router.get('/exemplar/book/:bookId', getExemplarsByBookHandler);
router.get('/exemplar/book/:bookId/available', getAvailableExemplarsByBookHandler);
router.get('/exemplar', getExemplars);
router.get('/exemplar/:id', getExemplar);

// Protected routes
router.post('/exemplar', addExemplar);
router.put('/exemplar/:id', editExemplar);
router.put('/exemplar/:id/status', editExemplarStatus);
router.delete('/exemplar/:id', removeExemplar);

export default router;
