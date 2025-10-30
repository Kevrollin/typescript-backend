import { Sequelize } from 'sequelize';
import pg from 'pg';
import config from './index';

let sequelize: Sequelize | null = null; // prevent multiple instances

export const getSequelize = (): Sequelize => {
  if (!sequelize) {
    console.log('⚙️ Initializing new Sequelize instance...');

    // Use pooled Neon connection if available
    const dbUrl =
      config.database.url.includes('-pooler.')
        ? config.database.url
        : config.database.url.replace('.neon.tech', '-pooler.neon.tech');

    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectModule: pg,
      logging: config.database.logging ? console.log : false,
      pool: {
        max: 3,
        min: 0,
        idle: 10000,
        acquire: 30000,
      },
      dialectOptions: {
        ssl:
          config.database.url.includes('neon.tech') ||
          config.app.env === 'production'
            ? { require: true, rejectUnauthorized: false }
            : false,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ESOCKETTIMEDOUT/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnection/,
        ],
        max: 2,
      },
    });
  }

  return sequelize;
};

// ✅ test connection safely
export const testConnection = async (): Promise<boolean> => {
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Optional: sync (for dev)
export const syncDatabase = async (force = false): Promise<void> => {
  const sequelize = getSequelize();
  await sequelize.sync({ force });
  console.log('✅ Database synced successfully.');
};

// Optional: close connection
export const closeConnection = async (): Promise<void> => {
  const sequelize = getSequelize();
  await sequelize.close();
  console.log('🛑 Database connection closed.');
};

export default getSequelize();
