import express from 'express';
import {
  getLoans,
  getLoan,
  getUserLoans,
  getOverdue,
  getStats,
  borrow,
  returnLoan,
  extend,
  syncOverdue,
  removeLoan
} from '../../../controllers/lendingController.js';

const router = express.Router();

// Public routes
// Yang spesifik di atas '/loan/:id'
router.get('/loan/stats', getStats);
router.get('/loan/overdue', getOverdue);
router.get('/loan/user/:userId', getUserLoans);
router.get('/loan', getLoans);
router.get('/loan/:id', getLoan);

// Protected routes
router.post('/loan/borrow', borrow);
router.put('/loan/:id/return', returnLoan);
router.put('/loan/:id/extend', extend);
router.post('/loan/sync-overdue', syncOverdue);
router.delete('/loan/:id', removeLoan);

export default router;
