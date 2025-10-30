// api/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
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

  // Remove global CORS headers here — let Express handle it
  // Only handle OPTIONS quickly
 const allowedOrigins = [
  'https://fundhubui-v1.vercel.app',
  'http://localhost:5173'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin || '')) {
  res.setHeader('Access-Control-Allow-Origin', origin!);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}


  // Delegate everything else to Express via serverless-http
  return handler(req, res);
};
