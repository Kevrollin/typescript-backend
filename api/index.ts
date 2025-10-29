// Vercel serverless function entry point for TypeScript backend
import type { Request, Response } from 'express';
import app from '../src/app';
import cors from 'cors';

// ✅ Configure CORS for your frontend and local dev
const allowedOrigins = [
  'https://fundhubui-v1.vercel.app',
  'http://localhost:5173', // optional for local testing
];

// Apply CORS middleware before anything else
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy does not allow access from origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Handle preflight requests globally
app.options('*', cors());

// Handle serverless function lifecycle
let isWarm = false;

export default async (req: Request, res: Response) => {
  // Warm up database connection on first request
  if (!isWarm) {
    try {
      const { testConnection } = await import('../src/config/database');
      await testConnection();
      isWarm = true;
      console.log('Database connection warmed up');
    } catch (error) {
      console.error('Failed to warm up database connection:', error);
    }
  }

  // ✅ Send proper CORS headers in all responses
  res.setHeader('Access-Control-Allow-Origin', 'https://fundhubui-v1.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // If it's a preflight request, end it here
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return app(req, res);
};
