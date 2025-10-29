import { Sequelize } from 'sequelize';
import pg from 'pg';
import config from './index';

// Create Sequelize instance with Vercel-optimized configuration
const sequelize = new Sequelize(config.database.url, {
  logging: config.database.logging ? console.log : false,
  pool: {
    min: 0, // Minimum connections for serverless
    max: 1, // Maximum connections for serverless
    acquire: 30000,
    idle: 10000,
  },
  dialect: 'postgres',
  dialectModule: pg, // Explicitly specify pg module
  dialectOptions: {
    ssl: config.database.url.includes('neon.tech') || config.app.env === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    // Vercel-specific options
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  // Vercel serverless optimization
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ESOCKETTIMEDOUT/,
      /EHOSTUNREACH/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  },
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Sync database (for development)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Database synchronization failed:', error);
    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

export { sequelize };
export default sequelize;
