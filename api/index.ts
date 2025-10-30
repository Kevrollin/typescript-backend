import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import app from '../src/app.js'; // or '../src/app' if using ts directly

let isWarm = false;
const handler = serverless(app);

export default async function (req: VercelRequest, res: VercelResponse) {
  if (!isWarm) {
    try {
      const { testConnection } = await import('../src/config/database.js');
      await testConnection();
      console.log('✅ DB warmed up');
      isWarm = true;
    } catch (err) {
      console.error('❌ DB warm-up failed:', err);
    }
  }

  const allowedOrigins = [
    'https://fundhubui-v1.vercel.app',
    'http://localhost:5173',
    ...(process.env.CORS_ORIGINS?.split(',').map(v => v.trim()) ?? [])
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return handler(req, res);
}
