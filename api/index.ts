// Vercel serverless function entry point for TypeScript backend
import type { Request, Response } from 'express';
import app from '../src/app';

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
