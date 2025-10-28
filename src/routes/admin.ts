import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/AdminController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const verifyStudentValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('Invalid user ID'),
  body('approve')
    .isBoolean()
    .withMessage('Approve must be a boolean'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
];

// Routes
router.get('/verifications', verifyToken, AdminController.getPendingVerifications);
router.post('/verify-student', verifyToken, verifyStudentValidation, AdminController.verifyStudent);
router.get('/stats', verifyToken, AdminController.getAnalytics);
router.get('/users', verifyToken, AdminController.getUsers);

export default router;
