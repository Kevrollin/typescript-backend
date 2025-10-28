// Core types and interfaces for FundHub TypeScript Backend
import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  fullName?: string;
  phone?: string;
  profilePicture?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: number;
  userId: number;
  schoolEmail: string;
  schoolName: string;
  admissionNumber: string;
  idNumber?: string;
  estimatedGraduationYear?: number;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  verifiedBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatus;
  category: ProjectCategory;
  creatorId: number;
  featuredImage?: string;
  images?: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Donation {
  id: number;
  amount: number;
  donorId: number;
  projectId: number;
  status: DonationStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  message?: string;
  anonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: CampaignStatus;
  organizerId: number;
  startDate: Date;
  endDate: Date;
  featuredImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: number;
  userId: number;
  publicKey: string;
  secretKey?: string;
  network: StellarNetwork;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Enums
export enum UserRole {
  GUEST = 'GUEST',
  BASE_USER = 'BASE_USER',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  INSTITUTION = 'INSTITUTION',
  SPONSOR = 'SPONSOR'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  FUNDED = 'FUNDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ProjectCategory {
  EDUCATION = 'EDUCATION',
  HEALTHCARE = 'HEALTHCARE',
  TECHNOLOGY = 'TECHNOLOGY',
  ARTS = 'ARTS',
  SPORTS = 'SPORTS',
  ENVIRONMENT = 'ENVIRONMENT',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER'
}

export enum DonationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  STRIPE = 'STRIPE',
  STELLAR = 'STELLAR',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum StellarNetwork {
  TESTNET = 'testnet',
  MAINNET = 'mainnet'
}

// Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface StudentRegistrationRequest extends SignupRequest {
  schoolEmail: string;
  schoolName: string;
  admissionNumber: string;
  idNumber?: string;
  estimatedGraduationYear?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user?: Omit<User, 'passwordHash'>;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  targetAmount: number;
  category: ProjectCategory;
  featuredImage?: string;
  images?: string[];
  deadline?: Date;
}

export interface CreateDonationRequest {
  amount: number;
  projectId: number;
  paymentMethod: PaymentMethod;
  message?: string;
  anonymous?: boolean;
}

export interface CreateCampaignRequest {
  title: string;
  description: string;
  targetAmount: number;
  startDate: Date;
  endDate: Date;
  featuredImage?: string;
}

// JWT Payload
export interface JWTPayload {
  sub: number;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Express Request extensions
export interface AuthenticatedRequest extends Request {
  user: User;
  verifiedStudent?: Student;
}

// Database configuration
export interface DatabaseConfig {
  url: string;
  logging: boolean;
  pool?: {
    min: number;
    max: number;
    acquire: number;
    idle: number;
  };
}

// Application configuration
export interface AppConfig {
  name: string;
  env: string;
  port: number;
  debug: boolean;
}

// Security configuration
export interface SecurityConfig {
  secretKey: string;
  jwtExpiration: number;
  bcryptRounds: number;
}

// CORS configuration
export interface CorsConfig {
  origins: string[];
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

// Stellar configuration
export interface StellarConfig {
  network: StellarNetwork;
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl: string;
  platformWalletPublic: string;
  platformWalletSecret: string;
}

// Stripe configuration
export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
}

// Redis configuration
export interface RedisConfig {
  url: string;
}

// Complete configuration interface
export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  security: SecurityConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  stellar: StellarConfig;
  stripe: StripeConfig;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
