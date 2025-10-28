import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Campaign, User, CampaignLike } from '../models';
import { CampaignStatus } from '../types';

export class CampaignController {
  /**
   * @swagger
   * /api/campaigns:
   *   get:
   *     summary: Get all campaigns with optional filtering
   *     tags: [Campaigns]
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for campaign title/description
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by campaign status
   *     responses:
   *       200:
   *         description: List of campaigns
   */
  static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status } = req.query;
      
      const where: any = {};
      const order: any = [['createdAt', 'DESC']];

      // Apply filters
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (status) {
        where.status = status;
      }

      const campaigns = await Campaign.findAll({
        where,
        order,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        limit: 50
      });

      res.json({
        success: true,
        data: campaigns,
        message: 'Campaigns retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}:
   *   get:
   *     summary: Get a specific campaign by ID
   *     tags: [Campaigns]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Campaign details
   *       404:
   *         description: Campaign not found
   */
  static async getCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const campaign = await Campaign.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ]
      });

      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }

      res.json({
        success: true,
        data: campaign,
        message: 'Campaign retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns:
   *   post:
   *     summary: Create a new campaign (Admin only)
   *     tags: [Campaigns]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - description
   *               - targetAmount
   *               - startDate
   *               - endDate
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetAmount:
   *                 type: number
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *               featuredImage:
   *                 type: string
   *     responses:
   *       201:
   *         description: Campaign created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin only
   */
  static async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Check if user is admin
      if ((req as any).user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { 
        title, 
        description, 
        tags,
        campaignType,
        startDate, 
        endDate, 
        heroImageUrl,
        fundingTrail = true,
        // Submission-related fields
        submissionStartDate,
        submissionEndDate,
        resultsAnnouncementDate,
        awardDistributionDate,
        // Custom Campaign Fields
        rewardPool,
        prizeFirstPosition,
        prizeSecondPosition,
        prizeThirdPosition,
        // Mini Campaign Fields
        prizePool,
        prizesBreakdown
      } = req.body;

      // Validate required fields based on campaign type
      if (!title || !description || !tags || !campaignType || !startDate || !endDate || !heroImageUrl) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      if (campaignType === 'custom') {
        if (!rewardPool || !prizeFirstPosition?.prize || !prizeFirstPosition?.gifts) {
          res.status(400).json({ message: 'Custom campaigns require reward pool and first position prize details' });
          return;
        }
      } else if (campaignType === 'mini') {
        if (!prizePool || !prizesBreakdown) {
          res.status(400).json({ message: 'Mini campaigns require prize pool and prizes breakdown' });
          return;
        }
      }

      const campaign = await Campaign.create({
        title,
        description,
        tags: Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag),
        campaignType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        heroImageUrl,
        fundingTrail,
        createdBy: (req as any).user.id,
        status: CampaignStatus.ACTIVE, // Admin-created campaigns are immediately active
        // Submission-related fields
        submissionStartDate: submissionStartDate ? new Date(submissionStartDate) : undefined,
        submissionEndDate: submissionEndDate ? new Date(submissionEndDate) : undefined,
        resultsAnnouncementDate: resultsAnnouncementDate ? new Date(resultsAnnouncementDate) : undefined,
        awardDistributionDate: awardDistributionDate ? new Date(awardDistributionDate) : undefined,
        // Custom Campaign Fields
        rewardPool: campaignType === 'custom' ? rewardPool : undefined,
        prizeFirstPosition: campaignType === 'custom' ? prizeFirstPosition : undefined,
        prizeSecondPosition: campaignType === 'custom' ? prizeSecondPosition : undefined,
        prizeThirdPosition: campaignType === 'custom' ? prizeThirdPosition : undefined,
        // Mini Campaign Fields
        prizePool: campaignType === 'mini' ? prizePool : undefined,
        prizesBreakdown: campaignType === 'mini' ? prizesBreakdown : undefined,
      });

      const campaignWithDetails = await Campaign.findByPk(campaign.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: campaignWithDetails,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}:
   *   put:
   *     summary: Update a campaign (Admin only)
   *     tags: [Campaigns]
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
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               targetAmount:
   *                 type: number
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *               featuredImage:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ACTIVE, COMPLETED, CANCELLED]
   *     responses:
   *       200:
   *         description: Campaign updated successfully
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Campaign not found
   */
  static async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;
      const { 
        title, 
        description, 
        tags,
        campaignType,
        startDate, 
        endDate, 
        heroImageUrl,
        fundingTrail,
        status,
        // Custom Campaign Fields
        rewardPool,
        prizeFirstPosition,
        prizeSecondPosition,
        prizeThirdPosition,
        // Mini Campaign Fields
        prizePool,
        prizesBreakdown
      } = req.body;

      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }

      // Update campaign fields
      if (title !== undefined) campaign.title = title;
      if (description !== undefined) campaign.description = description;
      if (tags !== undefined) campaign.tags = Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      if (campaignType !== undefined) campaign.campaignType = campaignType;
      if (startDate !== undefined) campaign.startDate = new Date(startDate);
      if (endDate !== undefined) campaign.endDate = new Date(endDate);
      if (heroImageUrl !== undefined) campaign.heroImageUrl = heroImageUrl;
      if (fundingTrail !== undefined) campaign.fundingTrail = fundingTrail;
      if (status !== undefined) campaign.status = status;
      
      // Update type-specific fields
      if (campaignType === 'custom') {
        if (rewardPool !== undefined) campaign.rewardPool = rewardPool;
        if (prizeFirstPosition !== undefined) campaign.prizeFirstPosition = prizeFirstPosition;
        if (prizeSecondPosition !== undefined) campaign.prizeSecondPosition = prizeSecondPosition;
        if (prizeThirdPosition !== undefined) campaign.prizeThirdPosition = prizeThirdPosition;
        // Clear mini campaign fields
        campaign.prizePool = undefined;
        campaign.prizesBreakdown = undefined;
      } else if (campaignType === 'mini') {
        if (prizePool !== undefined) campaign.prizePool = prizePool;
        if (prizesBreakdown !== undefined) campaign.prizesBreakdown = prizesBreakdown;
        // Clear custom campaign fields
        campaign.rewardPool = undefined;
        campaign.prizeFirstPosition = undefined;
        campaign.prizeSecondPosition = undefined;
        campaign.prizeThirdPosition = undefined;
      }

      await campaign.save();

      const campaignWithDetails = await Campaign.findByPk(campaign.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ]
      });

      res.json({
        success: true,
        data: campaignWithDetails,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}:
   *   delete:
   *     summary: Delete a campaign (Admin only)
   *     tags: [Campaigns]
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
   *         description: Campaign deleted successfully
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Campaign not found
   */
  static async deleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== 'ADMIN') {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;

      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found' });
        return;
      }

      await campaign.destroy();

      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}/like:
   *   post:
   *     summary: Like or unlike a campaign
   *     tags: [Campaigns]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Campaign ID
   *     responses:
   *       200:
   *         description: Like status updated successfully
   *       404:
   *         description: Campaign not found
   *       401:
   *         description: User not authenticated
   */
  static async toggleLike(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
        return;
      }

      // Check if user already liked this campaign
      const existingLike = await CampaignLike.findOne({
        where: {
          campaignId: id,
          userId: userId
        }
      });

      if (existingLike) {
        // Unlike: Remove the like and decrement count
        await existingLike.destroy();
        await campaign.decrement('likesCount');
        
        // Reload the campaign to get the updated likes count
        await campaign.reload();
        
        res.json({
          success: true,
          message: 'Campaign unliked successfully',
          liked: false,
          likesCount: campaign.likesCount
        });
      } else {
        // Like: Add the like and increment count
        await CampaignLike.create({
          campaignId: id,
          userId: userId
        });
        await campaign.increment('likesCount');
        
        // Reload the campaign to get the updated likes count
        await campaign.reload();
        
        res.json({
          success: true,
          message: 'Campaign liked successfully',
          liked: true,
          likesCount: campaign.likesCount
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/campaigns/{id}/like-status:
   *   get:
   *     summary: Get like status for a campaign
   *     tags: [Campaigns]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Campaign ID
   *     responses:
   *       200:
   *         description: Like status retrieved successfully
   *       404:
   *         description: Campaign not found
   */
  static async getLikeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
        return;
      }

      let liked = false;
      if (userId) {
        const existingLike = await CampaignLike.findOne({
          where: {
            campaignId: id,
            userId: userId
          }
        });
        liked = !!existingLike;
      }

      res.json({
        success: true,
        liked,
        likesCount: campaign.likesCount
      });
    } catch (error) {
      next(error);
    }
  }
}
