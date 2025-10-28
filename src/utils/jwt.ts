import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload, UserRole } from '../types';

export const createToken = (payload: {
  sub: number;
  username: string;
  role?: UserRole;
}): string => {
  const tokenPayload: JWTPayload = {
    sub: payload.sub,
    username: payload.username,
    role: payload.role || UserRole.BASE_USER,
  };

  return jwt.sign(tokenPayload, config.security.secretKey, {
    expiresIn: config.security.jwtExpiration,
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.security.secretKey) as unknown as JWTPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const generateEmailVerificationToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'email_verification' },
    config.security.secretKey,
    { expiresIn: '24h' }
  );
};

export const generatePasswordResetToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'password_reset' },
    config.security.secretKey,
    { expiresIn: '1h' }
  );
};

export const verifyEmailVerificationToken = (token: string): { userId: number } => {
  const decoded = jwt.verify(token, config.security.secretKey) as any;
  if (decoded.type !== 'email_verification') {
    throw new Error('Invalid token type');
  }
  return { userId: decoded.userId };
};

export const verifyPasswordResetToken = (token: string): { userId: number } => {
  const decoded = jwt.verify(token, config.security.secretKey) as any;
  if (decoded.type !== 'password_reset') {
    throw new Error('Invalid token type');
  }
  return { userId: decoded.userId };
};
