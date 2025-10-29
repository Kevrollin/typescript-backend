import { Pool } from 'pg';
import config from '../config';

// Create PostgreSQL connection pool for raw queries
// This is separate from Sequelize and used for direct SQL queries
export const pgPool = new Pool({
  connectionString: config.database.url,
  ssl: config.database.url.includes('neon.tech') || config.app.env === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pgPool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export default pgPool;

