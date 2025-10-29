import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import config from './config';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import donationRoutes from './routes/donations';
import adminRoutes from './routes/admin';
import studentRoutes from './routes/students';
import campaignRoutes from './routes/campaigns';
import submissionRoutes from './routes/submissions';
import uploadRoutes from './routes/upload';
import { ApiError } from './types';

// Import models to initialize associations
import './models';

const app: Application = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
// CORS configuration
const allowedOrigins = [
  'https://fundhubui-v1.vercel.app', // production frontend
  'http://localhost:5173', // dev mode
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman, curl, etc.

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
  })
);


// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (config.app.debug) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Simple test endpoint
app.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      environment: config.app.env,
      platform: 'typescript-backend'
    },
    message: 'Test successful'
  });
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    res.json({
      success: true,
      data: {
        status: dbConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: config.app.env,
        platform: 'typescript-backend',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        database: dbConnected ? 'connected' : 'disconnected'
      },
      message: 'Health check completed'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'FundHub TypeScript API',
      version: '1.0.0',
      status: 'healthy',
      platform: 'typescript-backend',
      environment: config.app.env,
      endpoints: {
        health: '/health',
        apiDocs: '/api-docs',
        api: '/api',
        test: '/test'
      }
    },
    message: 'Welcome to FundHub API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);
  
  // Handle multer errors
  if ((err as any).code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB.'
    });
    return;
  }
  
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.app.debug && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

export default app;
