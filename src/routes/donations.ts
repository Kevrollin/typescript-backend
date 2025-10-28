import { Router } from 'express';
import { body } from 'express-validator';
import { DonationController } from '../controllers/DonationController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const createDonationValidation = [
  body('projectId')
    .isUUID()
    .withMessage('Invalid project ID'),
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
  body('anonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous must be a boolean'),
];

// Routes
router.get('/', DonationController.getDonations);
router.get('/:id', DonationController.getDonation);
router.post('/', verifyToken, createDonationValidation, DonationController.createDonation);

export default router;
