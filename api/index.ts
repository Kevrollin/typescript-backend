// Vercel serverless function entry point for TypeScript backend

import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import serverless from 'serverless-http';

const handler = serverless(app);

// Lazy DB warm-up flag
let isWarm = false;

export default async function (req: VercelRequest, res: VercelResponse) {
  // Warm up the DB once per cold start
  if (!isWarm) {
    try {
      const { testConnection } = await import('../src/config/database');
      await testConnection();
      isWarm = true;
      console.log('✅ Database connection warmed up');
    } catch (error) {
      console.error('❌ Failed to warm up DB:', error);
    }
  }

  // Global CORS handling (important for OPTIONS preflight)
  res.setHeader(
    'Access-Control-Allow-Origin',
    'https://fundhubui-v1.vercel.app'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,PATCH,OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request right away
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Delegate everything else to Express via serverless-http
  return handler(req, res);
}
