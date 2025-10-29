import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Student, User, Project } from '../models';
import { UserRole } from '../types';

export class StudentController {
  /**
   * @swagger
   * /api/students/profile:
   *   get:
   *     summary: Get student profile
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Student profile
   *       403:
   *         description: Forbidden - not a student
   *       404:
   *         description: Student profile not found
   */
  static async getStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const student = await Student.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'status', 'createdAt']
          }
        ]
      });

      if (!student) {
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      res.json({
        success: true,
        data: student,
        message: 'Student profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/students/profile:
   *   put:
   *     summary: Update student profile
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               schoolEmail:
   *                 type: string
   *               schoolName:
   *                 type: string
   *               admissionNumber:
   *                 type: string
   *               idNumber:
   *                 type: string
   *               estimatedGraduationYear:
   *                 type: number
   *     responses:
   *       200:
   *         description: Student profile updated
   *       403:
   *         description: Forbidden - not a student
   *       404:
   *         description: Student profile not found
   */
  static async updateStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = (req as any).user.id;
      const updateData = req.body;

      const student = await Student.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'status', 'createdAt']
          }
        ]
      });

      if (!student) {
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      // Update student profile
      await student.update(updateData);

      // Refresh the student data
      const updatedStudent = await Student.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'status', 'createdAt']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedStudent,
        message: 'Student profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/students/my-projects:
   *   get:
   *     summary: Get student's projects
   *     tags: [Students]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by project status
   *     responses:
   *       200:
   *         description: Student's projects
   *       403:
   *         description: Forbidden - not a student
   */
  static async getMyProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { status } = req.query;

      const where: any = { creatorId: userId };
      if (status && typeof status === 'string') {
        where.status = status.toUpperCase();
      }

      // Fetch projects with all fields including engagement metrics
      const projects = await Project.findAll({
        where,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ],
        // Explicitly include all project fields
        attributes: [
          'id', 'title', 'description', 'goalAmount', 'currentAmount', 
          'status', 'category', 'creatorId', 'imageUrl', 'bannerImage',
          'screenshots', 'deadline', 'likesCount', 'sharesCount', 
          'viewsCount', 'createdAt', 'updatedAt'
        ]
      });

      res.json({
        success: true,
        data: projects,
        message: 'Student projects retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
