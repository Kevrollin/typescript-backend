import { Router } from 'express';
import { body } from 'express-validator';
import { StudentController } from '../controllers/StudentController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const updateStudentProfileValidation = [
  body('schoolEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid school email'),
  body('schoolName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('School name must be between 2 and 100 characters'),
  body('admissionNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Admission number must be between 1 and 50 characters'),
  body('idNumber')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters'),
  body('estimatedGraduationYear')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Invalid graduation year'),
  body('twitterUrl')
    .optional()
    .isURL()
    .withMessage('Invalid Twitter/X URL'),
  body('linkedinUrl')
    .optional()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('Invalid GitHub URL'),
];

// Routes
router.get('/profile', verifyToken, StudentController.getStudentProfile);
router.put('/profile', verifyToken, updateStudentProfileValidation, StudentController.updateStudentProfile);
router.get('/my-projects', verifyToken, StudentController.getMyProjects);

export default router;
