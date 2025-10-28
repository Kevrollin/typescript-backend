import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Project, User } from '../models';
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
            attributes: ['id', 'username', 'fullName', 'email']
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
            attributes: ['id', 'username', 'fullName', 'email']
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
        deadline,
        imageUrl
      } = req.body;

      const project = await Project.create({
        title,
        description,
        goalAmount,
        category: category as ProjectCategory,
        deadline: deadline ? new Date(deadline) : null,
        imageUrl,
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
}
