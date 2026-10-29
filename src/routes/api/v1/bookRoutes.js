import express from 'express';
import {
  getBooks,
  getBook,
  addBook,
  editBook,
  removeBook,
  getBooksBySubjects,
  getBooksByAuthors
} from '../../../controllers/bookController.js';

const router = express.Router();

// Public routes
// Dua route di bawah dipindah ke bawah '/book' supaya tidak bentrok
// dengan '/subject/:id' dan '/author/:id' milik subjek & pengarang
router.get('/book', getBooks);
router.get('/book/subject/:subjectId', getBooksBySubjects);
router.get('/book/author/:authorId', getBooksByAuthors);
router.get('/book/:id', getBook);

// Protected routes
router.post('/book', addBook);
router.put('/book/:id', editBook);
router.delete('/book/:id', removeBook);

export default router;
