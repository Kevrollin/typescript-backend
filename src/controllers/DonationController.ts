import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Donation, Project, User } from '../models';
import { DonationStatus } from '../types';

export class DonationController {
  /**
   * @swagger
   * /api/donations:
   *   get:
   *     summary: Get all donations with optional filtering
   *     tags: [Donations]
   *     parameters:
   *       - in: query
   *         name: donor_id
   *         schema:
   *           type: string
   *         description: Filter by donor ID
   *       - in: query
   *         name: project_id
   *         schema:
   *           type: string
   *         description: Filter by project ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by donation status
   *     responses:
   *       200:
   *         description: List of donations
   */
  static async getDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { donor_id, project_id, status } = req.query;
      
      const where: any = {};

      // Apply filters
      if (donor_id) {
        where.donorId = donor_id;
      }

      if (project_id) {
        where.projectId = project_id;
      }

      if (status) {
        where.status = status;
      }

      const donations = await Donation.findAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'donor',
            attributes: ['id', 'username', 'fullName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'goalAmount', 'currentAmount']
          }
        ],
        limit: 100
      });

      res.json({
        success: true,
        data: donations,
        message: 'Donations retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/donations:
   *   post:
   *     summary: Create a new donation
   *     tags: [Donations]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - projectId
   *               - amount
   *             properties:
   *               projectId:
   *                 type: string
   *               amount:
   *                 type: number
   *               message:
   *                 type: string
   *               anonymous:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Donation created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  static async createDonation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { projectId, amount, message, anonymous = false } = req.body;

      // Check if project exists
      const project = await Project.findByPk(projectId);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if project is still active
      if (project.status !== 'ACTIVE') {
        res.status(400).json({ message: 'Cannot donate to inactive project' });
        return;
      }

      // Create donation
      const donation = await Donation.create({
        projectId,
        donorId: (req as any).user.id,
        amount,
        message,
        anonymous,
        status: DonationStatus.PENDING
      });

      // Update project current amount
      project.currentAmount += amount;
      await project.save();

      // Update donation status to completed
      donation.status = DonationStatus.COMPLETED;
      await donation.save();

      const donationWithDetails = await Donation.findByPk(donation.id, {
        include: [
          {
            model: User,
            as: 'donor',
            attributes: ['id', 'username', 'fullName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'goalAmount', 'currentAmount']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: donationWithDetails,
        message: 'Donation created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/donations/{id}:
   *   get:
   *     summary: Get a specific donation by ID
   *     tags: [Donations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Donation details
   *       404:
   *         description: Donation not found
   */
  static async getDonation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const donation = await Donation.findByPk(id, {
        include: [
          {
            model: User,
            as: 'donor',
            attributes: ['id', 'username', 'fullName', 'email']
          },
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'title', 'description', 'goalAmount', 'currentAmount']
          }
        ]
      });

      if (!donation) {
        res.status(404).json({ message: 'Donation not found' });
        return;
      }

      res.json({
        success: true,
        data: donation,
        message: 'Donation retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
