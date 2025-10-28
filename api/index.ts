// Vercel serverless function entry point for TypeScript backend
import app from '../src/app';

// Handle serverless function lifecycle
let isWarm = false;

export default async (req: any, res: any) => {
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

  return app(req, res);
};
