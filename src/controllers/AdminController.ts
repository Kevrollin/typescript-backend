import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User, Student, Project, Donation } from '../models';
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
}
