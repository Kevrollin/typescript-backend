#!/usr/bin/env ts-node
/**
 * SQL Migration Runner for Neon DB
 * 
 * Executes SQL migration files directly on your Neon database.
 * 
 * Usage:
 *   npm run migrate:sql add_student_socials.sql
 *   npm run migrate:sql migrations/add_student_socials.sql
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL must be set in your .env file');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Please provide a migration file path');
  console.error('   Usage: npm run migrate:sql <path-to-sql-file>');
  console.error('   Example: npm run migrate:sql migrations/add_student_socials.sql');
  process.exit(1);
}

const runMigration = async () => {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    console.log('📡 Connecting to Neon database...');
    await pool.query('SELECT 1');
    console.log('✅ Connected successfully\n');

    // Read SQL file
    const sqlPath = migrationFile.startsWith('/') 
      ? migrationFile 
      : join(process.cwd(), migrationFile);
    
    console.log(`📄 Reading migration file: ${sqlPath}`);
    const sql = readFileSync(sqlPath, 'utf-8');
    
    if (!sql.trim()) {
      console.error('❌ Error: Migration file is empty');
      process.exit(1);
    }

    console.log('🚀 Executing migration...\n');
    console.log('SQL:', sql);
    console.log('');

    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Migration executed successfully!');
    console.log('✅ Added columns: twitter_url, linkedin_url, github_url to students table');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Details: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();

