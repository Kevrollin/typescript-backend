import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, Student } from '../models';
import { JWTPayload, UserRole, UserStatus, VerificationStatus } from '../types';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.security.secretKey) as unknown as JWTPayload;
    
    const user = await User.findByPk(decoded.sub);
    
    if (!user) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      res.status(403).json({ message: 'User is not active' });
      return;
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as any).user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (!roles.includes((req as any).user.role)) {
      res.status(403).json({ message: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
};

export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireStudent = requireRole(UserRole.STUDENT, UserRole.ADMIN);

// Middleware to verify that user is a verified student
export const requireVerifiedStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const student = await Student.findOne({
      where: { userId: (req as any).user.id, verificationStatus: VerificationStatus.VERIFIED }
    });

    if (!student) {
      res.status(403).json({ 
        message: 'You must be a verified student to perform this action' 
      });
      return;
    }

    (req as any).verifiedStudent = student;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error verifying student status' });
  }
};

// Optional authentication middleware
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.security.secretKey) as unknown as JWTPayload;
    
    const user = await User.findByPk(decoded.sub);
    
    if (user && user.status === UserStatus.ACTIVE) {
      (req as any).user = user;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
