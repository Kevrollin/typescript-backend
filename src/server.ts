import app from './app';
import config from './config';
import { testConnection, syncDatabase } from './config/database';

async function startServer(): Promise<void> {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Sync database in development
    if (config.app.env === 'development') {
      await syncDatabase(false);
    }

    // Start server
    const server = app.listen(config.app.port, () => {
      console.log(`🚀 Server running on port ${config.app.port}`);
      console.log(`📊 Environment: ${config.app.env}`);
      console.log(`🔗 Health check: http://localhost:${config.app.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
