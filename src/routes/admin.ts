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
router.get('/verifications/all', verifyToken, AdminController.getAllStudentVerifications);
router.post('/verify-student', verifyToken, verifyStudentValidation, AdminController.verifyStudent);
router.get('/stats', verifyToken, AdminController.getAnalytics);
router.get('/dashboard-stats', verifyToken, AdminController.getDashboardStats);
router.get('/users', verifyToken, AdminController.getUsers);
router.get('/users/:id', verifyToken, AdminController.getUserById);
router.put('/users/:id', verifyToken, AdminController.updateUser);
router.put('/users/:id/status', verifyToken, AdminController.updateUserStatus);
router.get('/projects', verifyToken, AdminController.getAllProjects);
router.put('/projects/:id/status', verifyToken, AdminController.updateProjectStatus);
router.delete('/projects/:id', verifyToken, AdminController.deleteProject);

// Campaign participants routes (Admin only)
router.get('/campaigns/:id/participants', verifyToken, AdminController.getCampaignParticipants);
router.get('/campaigns/active/participants', verifyToken, AdminController.getActiveCampaignsParticipants);

// Campaign dates management routes (Admin only)
router.get('/campaigns/:id/dates', verifyToken, AdminController.getCampaignDates);
router.put('/campaigns/:id/dates', verifyToken, AdminController.updateCampaignDates);

export default router;
