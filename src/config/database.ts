import { Sequelize } from 'sequelize';
import config from './index';

// Create Sequelize instance
const sequelize = new Sequelize(config.database.url, {
  logging: config.database.logging ? console.log : false,
  pool: config.database.pool,
  dialect: 'postgres',
  dialectOptions: {
    ssl: config.app.env === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
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
