import { Router } from 'express';
import { body } from 'express-validator';
import { CampaignSubmissionController } from '../controllers/CampaignSubmissionController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Validation middleware
const submitProjectValidation = [
  body('projectTitle')
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Project title must be between 3 and 255 characters'),
  body('projectDescription')
    .notEmpty()
    .withMessage('Project description is required')
    .isLength({ min: 10 })
    .withMessage('Project description must be at least 10 characters'),
  body('projectScreenshots')
    .isArray({ min: 1 })
    .withMessage('At least one screenshot is required'),
  body('projectScreenshots.*')
    .isURL()
    .withMessage('Each screenshot must be a valid URL'),
  body('projectLinks.demoUrl')
    .optional()
    .isURL()
    .withMessage('Demo URL must be a valid URL'),
  body('projectLinks.githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be a valid URL'),
  body('projectLinks.filesUrl')
    .optional()
    .isURL()
    .withMessage('Files URL must be a valid URL'),
  body('pitchDeckUrl')
    .optional()
    .isURL()
    .withMessage('Pitch deck URL must be a valid URL')
];

const gradeSubmissionValidation = [
  body('score')
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be between 0 and 100'),
  body('grade')
    .isIn(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'])
    .withMessage('Grade must be one of: A+, A, B+, B, C+, C, D, F'),
  body('feedback')
    .optional()
    .isString()
    .withMessage('Feedback must be a string'),
  body('status')
    .optional()
    .isIn(['graded', 'winner', 'runner_up', 'not_selected'])
    .withMessage('Status must be one of: graded, winner, runner_up, not_selected'),
  body('position')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Position must be between 1 and 3'),
  body('prizeAmount')
    .optional()
    .isDecimal()
    .withMessage('Prize amount must be a valid decimal number')
];

// Routes
router.post('/campaigns/:id/submit', submitProjectValidation, CampaignSubmissionController.submitProject);
router.get('/campaigns/:id/submissions', CampaignSubmissionController.getCampaignSubmissions);
router.put('/submissions/:id/grade', gradeSubmissionValidation, CampaignSubmissionController.gradeSubmission);
router.get('/submissions/:id', CampaignSubmissionController.getSubmission);
router.get('/submissions/user/:userId', CampaignSubmissionController.getUserSubmissions);

export default router;
