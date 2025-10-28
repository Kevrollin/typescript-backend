import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .optional()
    .trim(),
  body('phone')
    .optional()
    .trim(),
];

const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const studentRegisterValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 }),
  body('email')
    .isEmail(),
  body('password')
    .isLength({ min: 6 }),
  body('schoolEmail')
    .isEmail()
    .withMessage('Invalid school email'),
  body('schoolName')
    .trim()
    .notEmpty()
    .withMessage('School name is required'),
  body('admissionNumber')
    .trim()
    .notEmpty()
    .withMessage('Admission number is required'),
  body('idNumber')
    .optional()
    .trim(),
  body('estimatedGraduationYear')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Invalid graduation year'),
];

// Routes
router.post('/signup', signupValidation, AuthController.signup);
router.post('/login', loginValidation, AuthController.login);
router.post('/student-register', studentRegisterValidation, AuthController.studentRegister);
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/profile', verifyToken, AuthController.updateProfile);

export default router;
