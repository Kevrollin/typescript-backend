// api/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../src/app';

// Lazy DB warm-up flag
let isWarm = false;

// Wrap Express app with serverless-http
const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  // DB warm-up (optional)
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

  // Custom manual CORS handling (Vercel does not always use Express's CORS middleware for serverless)
  const allowedOrigins = [
    'https://fundhubui-v1.vercel.app',
    'http://localhost:5173',
    process.env.CORS_ORIGINS?.split(',').map(v => v.trim()).filter(Boolean) ?? []
  ].flat();

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Delegate remaining requests to Express (serverless)
  return handler(req, res);
};
