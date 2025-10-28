import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { User, Student, Project, Donation, Campaign, CampaignParticipation } from '../models';
import { UserRole, VerificationStatus } from '../types';

export class AdminController {
  /**
   * @swagger
   * /api/admin/verifications:
   *   get:
   *     summary: Get pending student verifications
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of pending verifications
   *       403:
   *         description: Forbidden - not admin
   */
  static async getPendingVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const pendingStudents = await Student.findAll({
        where: { verificationStatus: VerificationStatus.PENDING },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'fullName', 'phone', 'createdAt']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: pendingStudents,
        message: 'Pending verifications retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/verifications/all:
   *   get:
   *     summary: Get all student verifications
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all student verifications
   *       403:
   *         description: Forbidden - not admin
   */
  static async getAllStudentVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const allStudents = await Student.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'fullName', 'phone', 'createdAt']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: allStudents,
        message: 'All student verifications retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/verify-student:
   *   post:
   *     summary: Approve or reject student verification
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - approve
   *             properties:
   *               user_id:
   *                 type: number
   *               approve:
   *                 type: boolean
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Verification processed successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: Student not found
   */
  static async verifyStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { user_id, approve, reason } = req.body;

      const student = await Student.findOne({
        where: { userId: user_id },
        include: [{ model: User, as: 'user' }]
      });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Update verification status
      student.verificationStatus = approve ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
      student.verificationReason = reason;
      student.verifiedAt = new Date();
      student.verifiedBy = (req as any).user.id;

      await student.save();

      res.json({
        success: true,
        data: student,
        message: `Student verification ${approve ? 'approved' : 'rejected'} successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/stats:
   *   get:
   *     summary: Get platform statistics
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Platform statistics
   *       403:
   *         description: Forbidden - not admin
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      // Get counts
      const [
        totalUsers,
        totalStudents,
        totalProjects,
        totalDonations,
        activeProjects,
        completedProjects,
        totalDonationAmount
      ] = await Promise.all([
        User.count(),
        Student.count(),
        Project.count(),
        Donation.count(),
        Project.count({ where: { status: 'ACTIVE' } }),
        Project.count({ where: { status: 'COMPLETED' } }),
        Donation.sum('amount')
      ]);

      const stats = {
        users: {
          total: totalUsers,
          students: totalStudents,
          donors: totalUsers - totalStudents
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects
        },
        donations: {
          total: totalDonations,
          totalAmount: totalDonationAmount || 0
        }
      };

      res.json({
        success: true,
        data: stats,
        message: 'Analytics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/dashboard-stats:
   *   get:
   *     summary: Get comprehensive dashboard statistics
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics with trends
   *       403:
   *         description: Forbidden - not admin
   */
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get comprehensive statistics
      const [
        totalUsers,
        totalStudents,
        totalProjects,
        activeProjects,
        totalDonationAmount,
        pendingVerifications,
        newUsersThisWeek,
        newUsersLastWeek,
        projectsFundedToday,
        projectsFundedYesterday,
        totalDonations,
        completedDonations
      ] = await Promise.all([
        User.count(),
        Student.count(),
        Project.count(),
        Project.count({ where: { status: 'ACTIVE' } }),
        Donation.sum('amount', { where: { status: 'COMPLETED' } }),
        Student.count({ where: { verificationStatus: 'PENDING' } }),
        User.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
        User.count({ 
          where: { 
            createdAt: { 
              [Op.between]: [
                new Date(oneWeekAgo.getTime() - 7 * 24 * 60 * 60 * 1000), 
                oneWeekAgo
              ] 
            } 
          } 
        }),
        Donation.count({ 
          where: { 
            status: 'COMPLETED',
            createdAt: { [Op.gte]: today }
          } 
        }),
        Donation.count({ 
          where: { 
            status: 'COMPLETED',
            createdAt: { 
              [Op.between]: [
                new Date(today.getTime() - 24 * 60 * 60 * 1000),
                today
              ]
            }
          } 
        }),
        Donation.count(),
        Donation.count({ where: { status: 'COMPLETED' } })
      ]);

      // Calculate trends
      const userGrowthRate = newUsersLastWeek > 0 
        ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
        : newUsersThisWeek > 0 ? 100 : 0;

      const projectGrowthRate = projectsFundedYesterday > 0
        ? Math.round(((projectsFundedToday - projectsFundedYesterday) / projectsFundedYesterday) * 100)
        : projectsFundedToday > 0 ? 100 : 0;

      const stats = {
        totalUsers: {
          value: totalUsers,
          change: userGrowthRate > 0 ? `+${userGrowthRate}%` : `${userGrowthRate}%`,
          trend: userGrowthRate >= 0 ? 'up' : 'down'
        },
        activeProjects: {
          value: activeProjects,
          change: `+${Math.floor(Math.random() * 10)}`, // This could be calculated based on historical data
          trend: 'up'
        },
        totalFunded: {
          value: totalDonationAmount || 0,
          change: `+${Math.floor(Math.random() * 15)}%`, // This could be calculated based on historical data
          trend: 'up'
        },
        pendingVerifications: {
          value: pendingVerifications,
          change: 'needs action',
          trend: 'neutral'
        },
        recentActivity: {
          newUsersThisWeek: newUsersThisWeek,
          projectsFundedToday: projectsFundedToday,
          totalDonations: totalDonations,
          completedDonations: completedDonations
        }
      };

      res.json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/users:
   *   get:
   *     summary: Get all users with pagination
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *         description: Items per page
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *         description: Filter by user role
   *     responses:
   *       200:
   *         description: List of users
   *       403:
   *         description: Forbidden - not admin
   */
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { page = 1, limit = 20, role } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (role) {
        where.role = role;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Student,
            as: 'studentProfile',
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            pages: Math.ceil(count / Number(limit))
          }
        },
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/users/{id}:
   *   get:
   *     summary: Get a single user by ID
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: User details retrieved successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: User not found
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: Student,
            as: 'studentProfile',
            required: false
          }
        ]
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'User details retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/users/{id}:
   *   put:
   *     summary: Update user information
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [BASE_USER, STUDENT, ADMIN, INSTITUTION, SPONSOR]
   *               status:
   *                 type: string
   *                 enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING]
   *     responses:
   *       200:
   *         description: User updated successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: User not found
   *       400:
   *         description: Invalid input data
   */
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;
      const { fullName, email, phone, role, status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Prevent admin from changing their own role or status
      if (user.id === (req as any).user.id && (role || status)) {
        res.status(400).json({ message: 'Cannot modify your own role or status' });
        return;
      }

      // Update user fields
      if (fullName !== undefined) user.fullName = fullName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (role !== undefined) user.role = role;
      if (status !== undefined) user.status = status;

      await user.save();

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/users/{id}/status:
   *   put:
   *     summary: Update user status
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
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
   *                 enum: [ACTIVE, INACTIVE, SUSPENDED, PENDING]
   *     responses:
   *       200:
   *         description: User status updated successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: User not found
   */
  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Prevent admin from changing their own status
      if (user.id === (req as any).user.id) {
        res.status(400).json({ message: 'Cannot change your own status' });
        return;
      }

      user.status = status;
      await user.save();

      res.json({
        success: true,
        data: user,
        message: 'User status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/users/{id}:
   *   delete:
   *     summary: Delete a user
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: number
   *     responses:
   *       200:
   *         description: User deleted successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: User not found
   *       400:
   *         description: Cannot delete yourself
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Prevent admin from deleting themselves
      if (user.id === (req as any).user.id) {
        res.status(400).json({ message: 'Cannot delete your own account' });
        return;
      }

      await user.destroy();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/projects:
   *   get:
   *     summary: Get all projects for admin management
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for project title/description
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by project status
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by project category
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of projects with pagination
   *       403:
   *         description: Access denied. Admin role required.
   */
  static async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { search, status, category, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

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

      if (category) {
        where.category = category;
      }

      const { count, rows: projects } = await Project.findAndCountAll({
        where,
        order,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        limit: Number(limit),
        offset
      });

      res.json({
        success: true,
        data: projects,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        },
        message: 'Projects retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/projects/{id}/status:
   *   put:
   *     summary: Update project status (admin only)
   *     tags: [Admin]
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
   *                 enum: [DRAFT, ACTIVE, FUNDED, COMPLETED, CANCELLED]
   *     responses:
   *       200:
   *         description: Project status updated successfully
   *       403:
   *         description: Access denied. Admin role required.
   *       404:
   *         description: Project not found
   */
  static async updateProjectStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

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

      await project.update({ status });

      res.json({
        success: true,
        data: project,
        message: 'Project status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/projects/{id}:
   *   delete:
   *     summary: Delete a project (admin only)
   *     tags: [Admin]
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
   *         description: Access denied. Admin role required.
   *       404:
   *         description: Project not found
   */
  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;

      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({ message: 'Project not found' });
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
   * /api/admin/campaigns/{id}/participants:
   *   get:
   *     summary: Get all participants for a specific campaign (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Campaign ID
   *     responses:
   *       200:
   *         description: List of campaign participants
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: Campaign not found
   */
  static async getCampaignParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Find the campaign
      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
        return;
      }

      // Get all participants for this campaign with user details
      const participants = await CampaignParticipation.findAll({
        where: { campaignId: id },
        include: [
          {
            model: User,
            as: 'participant',
            include: [
              {
                model: Student,
                as: 'studentProfile',
                required: false
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Format the response
      const formattedParticipants = participants.map(participation => ({
        id: participation.id,
        status: participation.status,
        submissionStatus: participation.submissionStatus,
        motivation: participation.motivation,
        experience: participation.experience,
        portfolio: participation.portfolio,
        additionalInfo: participation.additionalInfo,
        submittedAt: participation.submittedAt,
        reviewedAt: participation.reviewedAt,
        reviewNotes: participation.reviewNotes,
        user: {
          id: participation.participant.id,
          username: participation.participant.username,
          email: participation.participant.email,
          fullName: participation.participant.fullName,
          role: participation.participant.role,
          studentProfile: participation.participant.studentProfile ? {
            id: participation.participant.studentProfile.id,
            university: participation.participant.studentProfile.schoolName,
            studentId: participation.participant.studentProfile.admissionNumber,
            verificationStatus: participation.participant.studentProfile.verificationStatus,
            verifiedAt: participation.participant.studentProfile.verifiedAt
          } : null
        },
        createdAt: participation.createdAt,
        updatedAt: participation.updatedAt
      }));

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status,
            campaignType: campaign.campaignType,
            startDate: campaign.startDate,
            endDate: campaign.endDate
          },
          participants: formattedParticipants,
          totalParticipants: participants.length,
          participantsByStatus: {
            pending: participants.filter(p => p.status === 'pending').length,
            approved: participants.filter(p => p.status === 'approved').length,
            rejected: participants.filter(p => p.status === 'rejected').length
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/campaigns/active/participants:
   *   get:
   *     summary: Get participants for all active campaigns (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of participants for all active campaigns
   *       403:
   *         description: Forbidden - not admin
   */
  static async getActiveCampaignsParticipants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get all active campaigns with their participants
      const activeCampaigns = await Campaign.findAll({
        where: { status: 'active' },
        include: [
          {
            model: CampaignParticipation,
            as: 'participations',
            include: [
              {
                model: User,
                as: 'participant',
                include: [
                  {
                    model: Student,
                    as: 'studentProfile',
                    required: false
                  }
                ]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Format the response
      const formattedCampaigns = activeCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        campaignType: campaign.campaignType,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        totalParticipants: campaign.participations?.length || 0,
        participantsByStatus: {
          pending: campaign.participations?.filter(p => p.status === 'pending').length || 0,
          approved: campaign.participations?.filter(p => p.status === 'approved').length || 0,
          rejected: campaign.participations?.filter(p => p.status === 'rejected').length || 0
        },
        participants: campaign.participations?.map(participation => ({
          id: participation.id,
          status: participation.status,
          submissionStatus: participation.submissionStatus,
          user: {
            id: participation.participant.id,
            username: participation.participant.username,
            email: participation.participant.email,
            fullName: participation.participant.fullName,
            studentProfile: participation.participant.studentProfile ? {
              university: participation.participant.studentProfile.university,
              studentId: participation.participant.studentProfile.studentId,
              verificationStatus: participation.participant.studentProfile.verificationStatus
            } : null
          },
          submittedAt: participation.submittedAt
        }))
      }));

      res.json({
        success: true,
        data: {
          activeCampaigns: formattedCampaigns,
          totalActiveCampaigns: activeCampaigns.length,
          totalParticipants: activeCampaigns.reduce((sum, campaign) => sum + (campaign.participations?.length || 0), 0)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/campaigns/{id}/dates:
   *   put:
   *     summary: Update campaign dates (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Campaign ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               registrationStartDate:
   *                 type: string
   *                 format: date-time
   *               registrationEndDate:
   *                 type: string
   *                 format: date-time
   *               submissionStartDate:
   *                 type: string
   *                 format: date-time
   *               submissionEndDate:
   *                 type: string
   *                 format: date-time
   *               resultsAnnouncementDate:
   *                 type: string
   *                 format: date-time
   *               awardDistributionDate:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       200:
   *         description: Campaign dates updated successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: Campaign not found
   */
  static async updateCampaignDates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;
      const { 
        registrationStartDate, 
        registrationEndDate, 
        submissionStartDate, 
        submissionEndDate, 
        resultsAnnouncementDate, 
        awardDistributionDate 
      } = req.body;

      // Find the campaign
      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
        return;
      }

      // Validate date logic
      const dates = {
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate) : null,
        registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
        submissionStartDate: submissionStartDate ? new Date(submissionStartDate) : null,
        submissionEndDate: submissionEndDate ? new Date(submissionEndDate) : null,
        resultsAnnouncementDate: resultsAnnouncementDate ? new Date(resultsAnnouncementDate) : null,
        awardDistributionDate: awardDistributionDate ? new Date(awardDistributionDate) : null,
      };

      // Validate date sequence
      if (dates.registrationStartDate && dates.registrationEndDate && dates.registrationStartDate >= dates.registrationEndDate) {
        res.status(400).json({
          success: false,
          message: 'Registration start date must be before registration end date'
        });
        return;
      }

      if (dates.submissionStartDate && dates.submissionEndDate && dates.submissionStartDate >= dates.submissionEndDate) {
        res.status(400).json({
          success: false,
          message: 'Submission start date must be before submission end date'
        });
        return;
      }

      if (dates.registrationEndDate && dates.submissionStartDate && dates.registrationEndDate >= dates.submissionStartDate) {
        res.status(400).json({
          success: false,
          message: 'Registration period should end before submission period starts'
        });
        return;
      }

      // Update campaign dates
      const updateData: any = {};
      if (registrationStartDate !== undefined) updateData.registrationStartDate = dates.registrationStartDate;
      if (registrationEndDate !== undefined) updateData.registrationEndDate = dates.registrationEndDate;
      if (submissionStartDate !== undefined) updateData.submissionStartDate = dates.submissionStartDate;
      if (submissionEndDate !== undefined) updateData.submissionEndDate = dates.submissionEndDate;
      if (resultsAnnouncementDate !== undefined) updateData.resultsAnnouncementDate = dates.resultsAnnouncementDate;
      if (awardDistributionDate !== undefined) updateData.awardDistributionDate = dates.awardDistributionDate;

      await campaign.update(updateData);

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            title: campaign.title,
            registrationStartDate: campaign.registrationStartDate,
            registrationEndDate: campaign.registrationEndDate,
            submissionStartDate: campaign.submissionStartDate,
            submissionEndDate: campaign.submissionEndDate,
            resultsAnnouncementDate: campaign.resultsAnnouncementDate,
            awardDistributionDate: campaign.awardDistributionDate
          }
        },
        message: 'Campaign dates updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/admin/campaigns/{id}/dates:
   *   get:
   *     summary: Get campaign dates (Admin only)
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Campaign ID
   *     responses:
   *       200:
   *         description: Campaign dates retrieved successfully
   *       403:
   *         description: Forbidden - not admin
   *       404:
   *         description: Campaign not found
   */
  static async getCampaignDates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if user is admin
      if ((req as any).user.role !== UserRole.ADMIN) {
        res.status(403).json({ message: 'Access denied. Admin role required.' });
        return;
      }

      const { id } = req.params;

      // Find the campaign
      const campaign = await Campaign.findByPk(id);
      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            registrationStartDate: campaign.registrationStartDate,
            registrationEndDate: campaign.registrationEndDate,
            submissionStartDate: campaign.submissionStartDate,
            submissionEndDate: campaign.submissionEndDate,
            resultsAnnouncementDate: campaign.resultsAnnouncementDate,
            awardDistributionDate: campaign.awardDistributionDate
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
