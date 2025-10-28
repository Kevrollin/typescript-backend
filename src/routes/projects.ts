import { Router } from 'express';
import { body } from 'express-validator';
import { ProjectController } from '../controllers/ProjectController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const createProjectValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('goalAmount')
    .isFloat({ min: 1 })
    .withMessage('Goal amount must be a positive number'),
  body('category')
    .isIn(['EDUCATION', 'TECHNOLOGY', 'HEALTH', 'ENVIRONMENT', 'SOCIAL', 'ARTS', 'OTHER'])
    .withMessage('Invalid category'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline format'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
];

const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('goalAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Goal amount must be a positive number'),
  body('category')
    .optional()
    .isIn(['EDUCATION', 'TECHNOLOGY', 'HEALTH', 'ENVIRONMENT', 'SOCIAL', 'ARTS', 'OTHER'])
    .withMessage('Invalid category'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid deadline format'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
];

// Routes
router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProject);
router.post('/', verifyToken, createProjectValidation, ProjectController.createProject);
router.put('/:id', verifyToken, updateProjectValidation, ProjectController.updateProject);
router.delete('/:id', verifyToken, ProjectController.deleteProject);

export default router;
