import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { CampaignSubmission, CampaignParticipation, Campaign, User } from '../models';
import { SubmissionStatus } from '../types';

export class CampaignSubmissionController {
  /**
   * @swagger
   * /api/campaigns/{id}/submit:
   *   post:
   *     summary: Submit project for a campaign
   *     tags: [Campaign Submissions]
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
   *               - projectTitle
   *               - projectDescription
   *               - projectScreenshots
   *             properties:
   *               projectTitle:
   *                 type: string
   *               projectDescription:
   *                 type: string
   *               projectScreenshots:
   *                 type: array
   *                 items:
   *                   type: string
   *               projectLinks:
   *                 type: object
   *                 properties:
   *                   demoUrl:
   *                     type: string
   *                   githubUrl:
   *                     type: string
   *                   filesUrl:
   *                     type: string
   *               pitchDeckUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: Project submitted successfully
   *       400:
   *         description: Validation error or submission not allowed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: User not eligible to submit
   */
  static async submitProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const campaignId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Check if user is a student
      if (userRole !== 'STUDENT') {
        res.status(403).json({ 
          success: false,
          message: 'Only students can submit projects for campaigns' 
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

      // Check if submission period is open
      const now = new Date();
      if (campaign.submissionStartDate && now < campaign.submissionStartDate) {
        res.status(400).json({ 
          success: false,
          message: 'Submission period has not started yet' 
        });
        return;
      }

      if (campaign.submissionEndDate && now > campaign.submissionEndDate) {
        res.status(400).json({ 
          success: false,
          message: 'Submission period has ended' 
        });
        return;
      }

      // Check if user has approved participation
      const participation = await CampaignParticipation.findOne({
        where: {
          campaignId,
          userId,
          status: 'approved'
        }
      });

      if (!participation) {
        res.status(403).json({ 
          success: false,
          message: 'You must have approved participation to submit a project' 
        });
        return;
      }

      // Check if user has already submitted
      const existingSubmission = await CampaignSubmission.findOne({
        where: {
          participationId: participation.id
        }
      });

      if (existingSubmission) {
        res.status(400).json({ 
          success: false,
          message: 'You have already submitted a project for this campaign' 
        });
        return;
      }

      const { 
        projectTitle, 
        projectDescription, 
        projectScreenshots, 
        projectLinks = {}, 
        pitchDeckUrl 
      } = req.body;

      // Create submission
      const submission = await CampaignSubmission.create({
        campaignId,
        userId,
        participationId: participation.id,
        projectTitle,
        projectDescription,
        projectScreenshots: projectScreenshots || [],
        projectLinks,
        pitchDeckUrl,
        status: SubmissionStatus.SUBMITTED,
        submissionDate: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Project submitted successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}/submissions:
   *   get:
   *     summary: Get campaign submissions
   *     tags: [Campaign Submissions]
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
   *         description: List of submissions
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not campaign creator or admin
   */
  static async getCampaignSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
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
          message: 'Access denied. Only campaign creators and admins can view submissions.' 
        });
        return;
      }

      const submissions = await CampaignSubmission.findAll({
        where: { campaignId },
        include: [
          {
            model: User,
            as: 'submitter',
            attributes: ['id', 'username', 'fullName', 'email']
          },
          {
            model: CampaignParticipation,
            as: 'participation',
            attributes: ['id', 'motivation', 'experience']
          }
        ],
        order: [['submissionDate', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: submissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/submissions/{id}/grade:
   *   put:
   *     summary: Grade a submission
   *     tags: [Campaign Submissions]
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
   *               - score
   *               - grade
   *             properties:
   *               score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *               grade:
   *                 type: string
   *                 enum: [A+, A, B+, B, C+, C, D, F]
   *               feedback:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [graded, winner, runner_up, not_selected]
   *               position:
   *                 type: number
   *               prizeAmount:
   *                 type: number
   *     responses:
   *       200:
   *         description: Submission graded successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not campaign creator or admin
   */
  static async gradeSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const submissionId = parseInt(req.params.id);
      const { score, grade, feedback, status, position, prizeAmount } = req.body;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Find submission with campaign info
      const submission = await CampaignSubmission.findByPk(submissionId, {
        include: [
          {
            model: Campaign,
            as: 'campaign'
          }
        ]
      });

      if (!submission) {
        res.status(404).json({ 
          success: false,
          message: 'Submission not found' 
        });
        return;
      }

      // Check if user is campaign creator or admin
      const submissionWithCampaign = submission as any;
      if (submissionWithCampaign.campaign.createdBy !== userId && userRole !== 'ADMIN') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied. Only campaign creators and admins can grade submissions.' 
        });
        return;
      }

      // Update submission
      await submission.update({
        score,
        grade,
        feedback,
        status: status || SubmissionStatus.GRADED,
        position,
        prizeAmount,
        gradedBy: userId,
        gradedAt: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Submission graded successfully',
        data: submission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/submissions/{id}:
   *   get:
   *     summary: Get submission details
   *     tags: [Campaign Submissions]
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
   *         description: Submission details
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not submission owner, campaign creator, or admin
   *       404:
   *         description: Submission not found
   */
  static async getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submissionId = parseInt(req.params.id);
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const submission = await CampaignSubmission.findByPk(submissionId, {
        include: [
          {
            model: User,
            as: 'submitter',
            attributes: ['id', 'username', 'fullName', 'email']
          },
          {
            model: Campaign,
            as: 'campaign',
            attributes: ['id', 'title', 'createdBy']
          },
          {
            model: CampaignParticipation,
            as: 'participation',
            attributes: ['id', 'motivation', 'experience']
          }
        ]
      });

      if (!submission) {
        res.status(404).json({ 
          success: false,
          message: 'Submission not found' 
        });
        return;
      }

      // Check access permissions
      const submissionWithCampaign = submission as any;
      const isOwner = submission.userId === userId;
      const isCampaignCreator = submissionWithCampaign.campaign.createdBy === userId;
      const isAdmin = userRole === 'ADMIN';

      if (!isOwner && !isCampaignCreator && !isAdmin) {
        res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: submission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/submissions/user/{userId}:
   *   get:
   *     summary: Get user's submissions
   *     tags: [Campaign Submissions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of user's submissions
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - not the user or admin
   */
  static async getUserSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = parseInt(req.params.userId);
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      // Check if user can access these submissions
      if (targetUserId !== userId && userRole !== 'ADMIN') {
        res.status(403).json({ 
          success: false,
          message: 'Access denied' 
        });
        return;
      }

      const submissions = await CampaignSubmission.findAll({
        where: { userId: targetUserId },
        include: [
          {
            model: Campaign,
            as: 'campaign',
            attributes: ['id', 'title', 'status', 'submissionStartDate', 'submissionEndDate', 'resultsAnnouncementDate', 'awardDistributionDate']
          }
        ],
        order: [['submissionDate', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: submissions
      });
    } catch (error) {
      next(error);
    }
  }
}
