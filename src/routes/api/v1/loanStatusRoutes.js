import express from 'express';
import {
  getLoanStatuses,
  getLoanStatus,
  addLoanStatus,
  editLoanStatus,
  removeLoanStatus
} from '../../../controllers/loanStatusController.js';

const router = express.Router();

// Public routes
router.get('/loan-status', getLoanStatuses);
router.get('/loan-status/:id', getLoanStatus);

// Protected routes
router.post('/loan-status', addLoanStatus);
router.put('/loan-status/:id', editLoanStatus);
router.delete('/loan-status/:id', removeLoanStatus);

export default router;
