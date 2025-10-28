import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { CampaignParticipation } from '../models/CampaignParticipation';
import { Campaign } from '../models/Campaign';
import { User, Student, CampaignSubmission } from '../models';
import { VerificationStatus, SubmissionStatus } from '../types';

export class CampaignParticipationController {
  /**
   * @swagger
   * /api/campaigns/participate:
   *   post:
   *     summary: Participate in a campaign
   *     tags: [Campaign Participation]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - campaignId
   *               - motivation
   *               - experience
   *             properties:
   *               campaignId:
   *                 type: number
   *               motivation:
   *                 type: string
   *               experience:
   *                 type: string
   *               portfolio:
   *                 type: string
   *               additionalInfo:
   *                 type: string
   *     responses:
   *       201:
   *         description: Participation submitted successfully
   *       400:
   *         description: Validation error or campaign not found
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: User not eligible to participate
   */
  static async participateInCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { campaignId, motivation, experience, portfolio, additionalInfo } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Check if user is a student
      if (userRole !== 'STUDENT') {
        res.status(403).json({ 
          success: false,
          message: 'Only students can participate in campaigns' 
        });
        return;
      }

      // Check if student is verified
      const student = await Student.findOne({
        where: { userId }
      });

      if (!student) {
        res.status(403).json({ 
          success: false,
          message: 'Student profile not found. Please complete student registration first.',
          requiresVerification: true
        });
        return;
      }

      if (student.verificationStatus !== VerificationStatus.APPROVED) {
        res.status(403).json({ 
          success: false,
          message: 'Student verification required. Please complete student verification to participate in campaigns.',
          requiresVerification: true,
          verificationStatus: student.verificationStatus
        });
        return;
      }

      // Check if campaign exists and is active
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        res.status(404).json({ 
          success: false,
          message: 'Campaign not found' 
        });
        return;
      }

      if (campaign.status !== 'active') {
        res.status(400).json({ 
          success: false,
          message: 'Campaign is not active' 
        });
        return;
      }

      if (!campaign.fundingTrail) {
        res.status(400).json({ 
          success: false,
          message: 'Campaign does not allow participation' 
        });
        return;
      }

      // Check if user has already participated
      const existingParticipation = await CampaignParticipation.findOne({
        where: {
          campaignId,
          userId
        }
      });

      if (existingParticipation) {
        res.status(400).json({ 
          success: false,
          message: 'You have already participated in this campaign' 
        });
        return;
      }

      // Create participation
      const participation = await CampaignParticipation.create({
        campaignId,
        userId,
        motivation,
        experience,
        portfolio,
        additionalInfo,
        status: 'pending',
        submittedAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Participation submitted successfully',
        data: participation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}/participations:
   *   get:
   *     summary: Get campaign participations
   *     tags: [Campaign Participation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of participations
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not campaign creator or admin
   */
  static async getCampaignParticipations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Check if campaign exists
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        res.status(404).json({ 
          success: false,
          message: 'Campaign not found' 
        });
        return;
      }

      // Check if user is campaign creator or admin
      if (campaign.createdBy !== userId && userRole !== 'ADMIN') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied. Only campaign creators and admins can view participations.' 
        });
        return;
      }

      const participations = await CampaignParticipation.findAll({
        where: { campaignId },
        include: [
          {
            model: User,
            as: 'participant',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        order: [['submittedAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: participations
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/participations/{id}/review:
   *   put:
   *     summary: Review campaign participation
   *     tags: [Campaign Participation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               reviewNotes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Participation reviewed successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not campaign creator or admin
   */
  static async reviewParticipation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const participationId = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Find participation
      const participation = await CampaignParticipation.findByPk(participationId, {
        include: [
          {
            model: Campaign,
            as: 'campaign'
          }
        ]
      });

      if (!participation) {
        res.status(404).json({ 
          success: false,
          message: 'Participation not found' 
        });
        return;
      }

      // Check if user is campaign creator or admin
      const participationWithCampaign = participation as any;
      if (participationWithCampaign.campaign.createdBy !== userId && userRole !== 'ADMIN') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied. Only campaign creators and admins can review participations.' 
        });
        return;
      }

      // Update participation
      await participation.update({
        status,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: userId
      });

      res.status(200).json({
        success: true,
        message: 'Participation reviewed successfully',
        data: participation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}/participation-status:
   *   get:
   *     summary: Get user's participation status for a campaign
   *     tags: [Campaign Participation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Participation status retrieved successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Campaign not found
   */
  static async getParticipationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      // Check if campaign exists
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) {
        res.status(404).json({ 
          success: false,
          message: 'Campaign not found' 
        });
        return;
      }

      // Find participation
      const participation = await CampaignParticipation.findOne({
        where: {
          campaignId,
          userId
        },
        include: [
          {
            model: CampaignSubmission,
            as: 'submission',
            required: false
          }
        ]
      });

      const response = {
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status,
            submissionStartDate: campaign.submissionStartDate,
            submissionEndDate: campaign.submissionEndDate,
            resultsAnnouncementDate: campaign.resultsAnnouncementDate,
            awardDistributionDate: campaign.awardDistributionDate
          },
          participation: participation ? {
            id: participation.id,
            status: participation.status,
            submissionStatus: participation.submissionStatus,
            submittedAt: participation.submittedAt,
            reviewedAt: participation.reviewedAt,
            reviewNotes: participation.reviewNotes
          } : null
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
