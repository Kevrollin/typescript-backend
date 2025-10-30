import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
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

// Initialize associations
import './models';

const app: Application = express();

app.set('trust proxy', 1);

// Compression & Security
app.use(compression());
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS: allow frontend + preflight
const allowedOrigins = [
  'https://fundhubui-v1.vercel.app',
  'http://localhost:8080'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow curl/Postman
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 CORS blocked: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
  })
);

// Debug middleware
app.use((req, res, next) => {
  console.log('➡️ Incoming request:', req.method, req.originalUrl);
  next();
});

// Logging
app.use(config.app.debug ? morgan('dev') : morgan('combined'));

// Rate limiter (apply to all API routes)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test endpoint working ✅' });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      status: dbConnected ? 'healthy' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Health check failed' });
  }
});

// ✅ API Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  const statusCode = (err as ApiError).statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message,
    ...(config.app.debug && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found', path: req.path, method: req.method });
});

export default app;
