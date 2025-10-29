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
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
  body('bannerImage')
    .optional()
    .isURL()
    .withMessage('Invalid banner image URL'),
  body('screenshots')
    .optional()
    .isArray()
    .withMessage('Screenshots must be an array'),
  body('screenshots.*')
    .optional()
    .isURL()
    .withMessage('Each screenshot must be a valid URL'),
  // Optional project links (both camelCase and snake_case accepted)
  body('repoUrl').optional().isURL().withMessage('Invalid repo URL'),
  body('demoUrl').optional().isURL().withMessage('Invalid demo URL'),
  body('websiteUrl').optional().isURL().withMessage('Invalid website URL'),
  body('repo_url').optional().isURL().withMessage('Invalid repo URL'),
  body('demo_url').optional().isURL().withMessage('Invalid demo URL'),
  body('website_url').optional().isURL().withMessage('Invalid website URL'),
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
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
  body('bannerImage')
    .optional()
    .isURL()
    .withMessage('Invalid banner image URL'),
  body('screenshots')
    .optional()
    .isArray()
    .withMessage('Screenshots must be an array'),
  body('screenshots.*')
    .optional()
    .isURL()
    .withMessage('Each screenshot must be a valid URL'),
  // Optional project links (both camelCase and snake_case accepted)
  body('repoUrl').optional().isURL().withMessage('Invalid repo URL'),
  body('demoUrl').optional().isURL().withMessage('Invalid demo URL'),
  body('websiteUrl').optional().isURL().withMessage('Invalid website URL'),
  body('repo_url').optional().isURL().withMessage('Invalid repo URL'),
  body('demo_url').optional().isURL().withMessage('Invalid demo URL'),
  body('website_url').optional().isURL().withMessage('Invalid website URL'),
];

// Routes
router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProject);
router.post('/', verifyToken, createProjectValidation, ProjectController.createProject);
router.put('/:id', verifyToken, updateProjectValidation, ProjectController.updateProject);
router.delete('/:id', verifyToken, ProjectController.deleteProject);

// Like/Share/View routes
router.post('/:id/like', verifyToken, ProjectController.toggleLike);
router.get('/:id/like-status', ProjectController.getLikeStatus);
router.post('/:id/share', ProjectController.trackShare);
router.post('/:id/view', ProjectController.trackView);

// Analytics route
router.get('/:id/analytics', verifyToken, ProjectController.getProjectAnalytics);

export default router;
