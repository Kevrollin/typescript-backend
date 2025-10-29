import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Project, ProjectLike, ProjectShare, User, Donation } from '../models';
import { ProjectStatus, ProjectCategory } from '../types';

export class ProjectController {
  /**
   * @swagger
   * /api/projects:
   *   get:
   *     summary: Get all projects with optional filtering
   *     tags: [Projects]
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for project title/description
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by project category
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by project status
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *         description: Sort order (created_at, title, goal_amount)
   *     responses:
   *       200:
   *         description: List of projects
   */
  static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category, status, sort = 'created_at' } = req.query;
      
      const where: any = {};
      const order: any = [];

      // Apply filters
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category) {
        where.category = category;
      }

      if (status) {
        where.status = status;
      }

      // Apply sorting
      switch (sort) {
        case 'title':
          order.push(['title', 'ASC']);
          break;
        case 'goal_amount':
          order.push(['goalAmount', 'DESC']);
          break;
        case 'created_at':
        default:
          order.push(['createdAt', 'DESC']);
          break;
      }

      const projects = await Project.findAll({
        where,
        order,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email'],
            include: [
              {
                model: User.sequelize!.models.Student,
                as: 'studentProfile',
                attributes: ['twitterUrl', 'linkedinUrl', 'githubUrl']
              }
            ]
          }
        ],
        limit: 50
      });

      res.json({
        success: true,
        data: projects,
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}:
   *   get:
   *     summary: Get a specific project by ID
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Project details
   *       404:
   *         description: Project not found
   */
  static async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email'],
            include: [
              {
                model: User.sequelize!.models.Student,
                as: 'studentProfile',
                attributes: ['twitterUrl', 'linkedinUrl', 'githubUrl']
              }
            ]
          }
        ]
      });

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      res.json({
        success: true,
        data: project,
        message: 'Project retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects:
   *   post:
   *     summary: Create a new project
   *     tags: [Projects]
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
   *               - goalAmount
   *               - category
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               goalAmount:
   *                 type: number
   *               category:
   *                 type: string
   *               deadline:
   *                 type: string
   *                 format: date
   *               imageUrl:
   *                 type: string
   *     responses:
   *       201:
   *         description: Project created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        title,
        description,
        goalAmount,
        category,
        imageUrl,
        bannerImage,
        screenshots
      } = req.body;

      const project = await Project.create({
        title,
        description,
        goalAmount,
        category: category as ProjectCategory,
        imageUrl,
        bannerImage: bannerImage || imageUrl, // Use bannerImage if provided, fallback to imageUrl
        screenshots: Array.isArray(screenshots) ? screenshots : [],
        creatorId: (req as any).user.id,
        status: ProjectStatus.ACTIVE,
        currentAmount: 0
      });

      const projectWithCreator = await Project.findByPk(project.id, {
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
        data: projectWithCreator,
        message: 'Project created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}:
   *   put:
   *     summary: Update a project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               goalAmount:
   *                 type: number
   *               category:
   *                 type: string
   *               deadline:
   *                 type: string
   *                 format: date
   *               imageUrl:
   *                 type: string
   *     responses:
   *       200:
   *         description: Project updated successfully
   *       403:
   *         description: Forbidden - not project owner
   *       404:
   *         description: Project not found
   */
  static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is the project creator
      if (project.creatorId !== (req as any).user.id) {
        res.status(403).json({ message: 'You can only update your own projects' });
        return;
      }

      // Update project
      await project.update(updateData);

      const updatedProject = await Project.findByPk(id, {
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
        data: updatedProject,
        message: 'Project updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}:
   *   delete:
   *     summary: Delete a project
   *     tags: [Projects]
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
   *         description: Project deleted successfully
   *       403:
   *         description: Forbidden - not project owner
   *       404:
   *         description: Project not found
   */
  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is the project creator
      if (project.creatorId !== (req as any).user.id) {
        res.status(403).json({ message: 'You can only delete your own projects' });
        return;
      }

      await project.destroy();

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}/like:
   *   post:
   *     summary: Like or unlike a project
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Like status updated successfully
   *       404:
   *         description: Project not found
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

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Check if user already liked this project
      const existingLike = await ProjectLike.findOne({
        where: {
          projectId: id,
          userId: userId
        }
      });

      if (existingLike) {
        // Unlike: Remove the like and decrement count
        await existingLike.destroy();
        await project.decrement('likesCount');
        
        // Reload the project to get the updated likes count
        await project.reload();
        
        res.json({
          success: true,
          message: 'Project unliked successfully',
          liked: false,
          likesCount: project.likesCount
        });
      } else {
        // Like: Add the like and increment count
        await ProjectLike.create({
          projectId: id,
          userId: userId
        });
        await project.increment('likesCount');
        
        // Reload the project to get the updated likes count
        await project.reload();
        
        res.json({
          success: true,
          message: 'Project liked successfully',
          liked: true,
          likesCount: project.likesCount
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}/like-status:
   *   get:
   *     summary: Get like status for a project
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Like status retrieved successfully
   *       404:
   *         description: Project not found
   */
  static async getLikeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      let liked = false;
      if (userId) {
        const existingLike = await ProjectLike.findOne({
          where: {
            projectId: id,
            userId: userId
          }
        });
        liked = !!existingLike;
      }

      res.json({
        success: true,
        liked,
        likesCount: project.likesCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}/share:
   *   post:
   *     summary: Track a project share
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Share tracked successfully
   *       404:
   *         description: Project not found
   */
  static async trackShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { platform = 'direct' } = req.body;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Increment shares count
      await project.increment('sharesCount');
      
      // Create a ProjectShare record if user is authenticated
      if (userId) {
        try {
          await ProjectShare.create({
            projectId: parseInt(id),
            userId: userId,
            platform: platform
          });
        } catch (error: any) {
          // If record already exists (e.g., user shared multiple times), just update the count
          // The increment above already handles the count
          console.warn('Failed to create share record (may already exist):', error.message);
        }
      }
      
      // Reload the project to get the updated shares count
      await project.reload();

      res.json({
        success: true,
        message: 'Share tracked successfully',
        sharesCount: project.sharesCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}/view:
   *   post:
   *     summary: Track a project view
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: View tracked successfully
   *       404:
   *         description: Project not found
   */
  static async trackView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({
          success: false,
          message: 'Project not found'
        });
        return;
      }

      // Increment views count
      await project.increment('viewsCount');
      
      // Reload the project to get the updated views count
      await project.reload();

      res.json({
        success: true,
        message: 'View tracked successfully',
        viewsCount: project.viewsCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/projects/{id}/analytics:
   *   get:
   *     summary: Get project analytics including likes, shares, and views
   *     tags: [Projects]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Project ID
   *     responses:
   *       200:
   *         description: Project analytics
   *       403:
   *         description: Forbidden - user is not the project owner
   *       404:
   *         description: Project not found
   */
  static async getProjectAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const project = await Project.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ]
      });

      if (!project) {
        res.status(404).json({ message: 'Project not found' });
        return;
      }

      // Check if user is the creator
      if (project.creatorId !== userId) {
        res.status(403).json({ message: 'Access denied. You can only view analytics for your own projects.' });
        return;
      }

      // Get users who liked the project
      const likes = await ProjectLike.findAll({
        where: { projectId: id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName', 'email', 'profilePicture']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Get users who shared the project
      const shares = await ProjectShare.findAll({
        where: { projectId: id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName', 'email', 'profilePicture']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Get donation statistics
      const donations = await Donation.findAll({
        where: { 
          projectId: id,
          status: 'COMPLETED'
        },
        include: [
          {
            model: User,
            as: 'donor',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const totalDonations = donations.length;
      const totalDonated = donations.reduce((sum, d) => sum + parseFloat(d.amount as any), 0);
      const anonymousDonations = donations.filter(d => d.anonymous).length;

      res.json({
        success: true,
        data: {
          project: {
            id: project.id,
            title: project.title,
            status: project.status,
            viewsCount: project.viewsCount,
            likesCount: project.likesCount,
            sharesCount: project.sharesCount,
            goalAmount: project.goalAmount,
            currentAmount: project.currentAmount
          },
          engagement: {
            likes: {
              count: likes.length,
              users: likes.map((like: any) => ({
                user: like.user,
                likedAt: like.createdAt
              }))
            },
            shares: {
              count: shares.length,
              byPlatform: shares.reduce((acc: any, share: any) => {
                const platform = share.platform;
                if (!acc[platform]) acc[platform] = [];
                acc[platform].push({
                  user: share.user,
                  sharedAt: share.createdAt
                });
                return acc;
              }, {}),
              all: shares.map((share: any) => ({
                user: share.user,
                platform: share.platform,
                sharedAt: share.createdAt
              }))
            },
            donations: {
              totalCount: totalDonations,
              totalAmount: totalDonated,
              anonymousCount: anonymousDonations,
              publicCount: totalDonations - anonymousDonations,
              recent: donations.slice(0, 10).map((d: any) => ({
                donor: d.anonymous ? null : d.donor,
                amount: d.amount,
                message: d.message,
                isAnonymous: d.anonymous,
                donatedAt: d.createdAt
              }))
            }
          },
          performance: {
            totalViews: project.viewsCount || 0,
            totalLikes: project.likesCount || 0,
            totalShares: project.sharesCount || 0,
            totalDonations: totalDonations,
            totalRaised: totalDonated,
            fundingProgress: (project.currentAmount / project.goalAmount) * 100
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
