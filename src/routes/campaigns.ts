import { Router } from 'express';
import { body } from 'express-validator';
import { CampaignController } from '../controllers/CampaignController';
import { CampaignParticipationController } from '../controllers/CampaignParticipationController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const createCampaignValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('tags')
    .isArray({ min: 1 })
    .withMessage('At least one tag is required'),
  body('campaignType')
    .isIn(['custom', 'mini'])
    .withMessage('Campaign type must be either custom or mini'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('heroImageUrl')
    .isURL()
    .withMessage('Invalid hero image URL'),
  body('fundingTrail')
    .optional()
    .isBoolean()
    .withMessage('Funding trail must be a boolean'),
];

const updateCampaignValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('tags')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one tag is required'),
  body('campaignType')
    .optional()
    .isIn(['custom', 'mini'])
    .withMessage('Campaign type must be either custom or mini'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('heroImageUrl')
    .optional()
    .isURL()
    .withMessage('Invalid hero image URL'),
  body('fundingTrail')
    .optional()
    .isBoolean()
    .withMessage('Funding trail must be a boolean'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
];

// Participation validation
const participateValidation = [
  body('campaignId')
    .isInt({ min: 1 })
    .withMessage('Invalid campaign ID'),
  body('motivation')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Motivation must be between 10 and 1000 characters'),
  body('experience')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Experience must be between 10 and 1000 characters'),
  body('portfolio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Portfolio must be less than 500 characters'),
  body('additionalInfo')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional info must be less than 1000 characters'),
];

const reviewParticipationValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review notes must be less than 500 characters'),
];

// Routes
router.get('/', CampaignController.getCampaigns);
router.get('/:id', CampaignController.getCampaign);
router.post('/', verifyToken, createCampaignValidation, CampaignController.createCampaign);
router.put('/:id', verifyToken, updateCampaignValidation, CampaignController.updateCampaign);
router.delete('/:id', verifyToken, CampaignController.deleteCampaign);

// Participation routes
router.post('/participate', verifyToken, participateValidation, CampaignParticipationController.participateInCampaign);
router.get('/:id/participations', verifyToken, CampaignParticipationController.getCampaignParticipations);
router.get('/:id/participation-status', verifyToken, CampaignParticipationController.getParticipationStatus);
router.put('/participations/:id/review', verifyToken, reviewParticipationValidation, CampaignParticipationController.reviewParticipation);

// Like routes
router.post('/:id/like', verifyToken, CampaignController.toggleLike);
router.get('/:id/like-status', CampaignController.getLikeStatus);

export default router;
