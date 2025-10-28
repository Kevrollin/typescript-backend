import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { User, Student } from '../models';
import { createToken, generateEmailVerificationToken } from '../utils/jwt';
import { SignupRequest, StudentRegistrationRequest, LoginRequest, AuthResponse, UserRole, UserStatus, VerificationStatus } from '../types';

export class AuthController {
  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: Create a new user account
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 6
   *               fullName:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   *       400:
   *         description: Validation error or user already exists
   */
  static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, email, password, fullName, phone }: SignupRequest = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        res.status(400).json({ message: 'Username already registered' });
        return;
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        email,
        passwordHash,
        fullName,
        phone,
        role: UserRole.BASE_USER,
        status: UserStatus.ACTIVE,
      });

      // Generate email verification token
      const verificationToken = generateEmailVerificationToken(user.id);

      // Remove password hash from response
      const userJson = user.toJSON();

      res.status(201).json({
        success: true,
        data: userJson,
        message: 'User created successfully',
        verificationToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login and get access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   *       400:
   *         description: Inactive user
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password }: LoginRequest = req.body;

      // Find user
      const user = await User.findOne({ where: { username } });
      if (!user) {
        res.status(401).json({ message: 'Incorrect username or password' });
        return;
      }

      // Verify password
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        res.status(401).json({ message: 'Incorrect username or password' });
        return;
      }

      if (user.status !== UserStatus.ACTIVE) {
        res.status(400).json({ message: 'Inactive user' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Create token
      const token = createToken({ 
        sub: user.id, 
        username: user.username,
        role: user.role 
      });

      const response: AuthResponse = {
        access_token: token,
        token_type: 'bearer',
        user: user.toJSON(),
      };

      res.json({
        success: true,
        data: response,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/student-register:
   *   post:
   *     summary: Register as a student
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *               - schoolEmail
   *               - schoolName
   *               - admissionNumber
   *             properties:
   *               username:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               schoolEmail:
   *                 type: string
   *               schoolName:
   *                 type: string
   *               admissionNumber:
   *                 type: string
   *     responses:
   *       201:
   *         description: Student registered successfully
   *       400:
   *         description: Validation error
   */
  static async studentRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        username, email, password, fullName, phone,
        schoolEmail, schoolName, admissionNumber, idNumber, estimatedGraduationYear
      }: StudentRegistrationRequest = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        res.status(400).json({ message: 'Username already registered' });
        return;
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      const existingStudent = await Student.findOne({ where: { schoolEmail } });
      if (existingStudent) {
        res.status(400).json({ message: 'School email already registered' });
        return;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        username,
        email,
        passwordHash,
        fullName,
        phone,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      });

      // Create student profile
      await Student.create({
        userId: user.id,
        schoolEmail,
        schoolName,
        admissionNumber,
        idNumber,
        estimatedGraduationYear,
        verificationStatus: VerificationStatus.PENDING,
      });

      // Get user with student profile
      const userWithProfile = await User.findByPk(user.id, {
        include: [{ association: 'studentProfile' }],
      });

      const userJson = userWithProfile?.toJSON();

      res.status(201).json({
        success: true,
        data: userJson,
        message: 'Student registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get current user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *       401:
   *         description: Unauthorized
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findByPk((req as any).user.id, {
        include: [{ association: 'studentProfile' }],
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const userJson = user.toJSON();

      res.json({
        success: true,
        data: userJson,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   put:
   *     summary: Update user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fullName:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated
   *       401:
   *         description: Unauthorized
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fullName, phone } = req.body;

      const user = await User.findByPk((req as any).user.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      if (fullName) user.fullName = fullName;
      if (phone) user.phone = phone;

      await user.save();

      const userJson = user.toJSON();

      res.json({
        success: true,
        data: userJson,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
