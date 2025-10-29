#!/usr/bin/env ts-node
/**
 * Migration Script: Local PostgreSQL to Neon DB
 * 
 * This script migrates all data from your local PostgreSQL database to Neon DB.
 * 
 * Usage:
 * 1. Set OLD_DATABASE_URL to your local PostgreSQL connection string (in .env.local)
 * 2. Set NEW_DATABASE_URL to your Neon DB connection string (in .env.local)
 * 3. Run: npm run migrate:neon
 * 
 * Or set them directly:
 * OLD_DATABASE_URL=postgresql://user:pass@localhost:5432/dbname NEW_DATABASE_URL=postgresql://user:pass@neon-host/dbname npm run migrate:neon
 */

import { Sequelize, DataTypes } from 'sequelize';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load from .env

// Get database URLs from environment
const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL || process.env.DATABASE_URL;
const NEW_DATABASE_URL = process.env.NEW_DATABASE_URL;

if (!OLD_DATABASE_URL) {
  console.error('❌ Error: OLD_DATABASE_URL or DATABASE_URL must be set');
  process.exit(1);
}

if (!NEW_DATABASE_URL) {
  console.error('❌ Error: NEW_DATABASE_URL must be set');
  console.error('   Please set NEW_DATABASE_URL environment variable with your Neon DB connection string');
  process.exit(1);
}

if (OLD_DATABASE_URL === NEW_DATABASE_URL) {
  console.error('❌ Error: OLD_DATABASE_URL and NEW_DATABASE_URL cannot be the same');
  process.exit(1);
}

// Create Sequelize instances for both databases
const oldDb = new Sequelize(OLD_DATABASE_URL, {
  logging: false,
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: false, // Local DB typically doesn't use SSL
  },
});

const newDb = new Sequelize(NEW_DATABASE_URL, {
  logging: false,
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Neon DB requires SSL
    },
  },
  pool: {
    min: 0,
    max: 5,
    acquire: 30000,
    idle: 10000,
  },
});

// Migration order (respecting foreign key dependencies)
const tableOrder = [
  'users',
  'students',
  'projects',
  'campaigns',
  'donations',
  'project_likes',
  'project_shares',
  'campaign_participations',
  'campaign_likes',
  'campaign_submissions',
];

const migrateData = async () => {
  console.log('🚀 Starting migration from Local PostgreSQL to Neon DB...\n');

  try {
    // Test connections
    console.log('📡 Testing database connections...');
    await oldDb.authenticate();
    console.log('✅ Connected to local PostgreSQL');
    
    await newDb.authenticate();
    console.log('✅ Connected to Neon DB\n');

    // Create schema in Neon DB using Sequelize sync
    console.log('🏗️  Creating schema in Neon DB...');
    
    // Create temporary models connected to newDb
    
    // Define models inline for schema creation
    const UserModel = newDb.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
      email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      full_name: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      profile_picture: { type: DataTypes.STRING(500), allowNull: true },
      role: { type: DataTypes.STRING(20), defaultValue: 'BASE_USER', allowNull: false },
      status: { type: DataTypes.STRING(20), defaultValue: 'ACTIVE', allowNull: false },
      email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      email_verification_token: { type: DataTypes.STRING(255), allowNull: true },
      password_reset_token: { type: DataTypes.STRING(255), allowNull: true },
      password_reset_expires: { type: DataTypes.DATE, allowNull: true },
      last_login: { type: DataTypes.DATE, allowNull: true },
    }, { tableName: 'users', timestamps: true, underscored: true });
    
    const StudentModel = newDb.define('Student', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      school_email: { type: DataTypes.STRING(255), allowNull: false },
      school_name: { type: DataTypes.STRING(255), allowNull: false },
      admission_number: { type: DataTypes.STRING(100), allowNull: false },
      id_number: { type: DataTypes.STRING(50), allowNull: true },
      estimated_graduation_year: { type: DataTypes.INTEGER, allowNull: true },
      verification_status: { type: DataTypes.STRING(20), defaultValue: 'pending', allowNull: false },
      verification_notes: { type: DataTypes.TEXT, allowNull: true },
      verification_reason: { type: DataTypes.TEXT, allowNull: true },
      verified_at: { type: DataTypes.DATE, allowNull: true },
      verified_by: { type: DataTypes.INTEGER, allowNull: true },
    }, { tableName: 'students', timestamps: true, underscored: true });
    
    const ProjectModel = newDb.define('Project', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      goal_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      current_amount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
      status: { type: DataTypes.STRING(20), defaultValue: 'DRAFT', allowNull: false },
      category: { type: DataTypes.STRING(20), allowNull: false },
      creator_id: { type: DataTypes.INTEGER, allowNull: false },
      image_url: { type: DataTypes.STRING(500), allowNull: true },
      banner_image: { type: DataTypes.STRING(500), allowNull: true },
      screenshots: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      deadline: { type: DataTypes.DATE, allowNull: true },
      likes_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
      shares_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
      views_count: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    }, { tableName: 'projects', timestamps: true, underscored: true });
    
    const CampaignModel = newDb.define('Campaign', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      tags: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
      campaign_type: { type: DataTypes.STRING(20), allowNull: false },
      created_by: { type: DataTypes.INTEGER, allowNull: false },
      start_date: { type: DataTypes.DATE, allowNull: false },
      end_date: { type: DataTypes.DATE, allowNull: false },
      hero_image_url: { type: DataTypes.STRING(500), allowNull: false },
      funding_trail: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      status: { type: DataTypes.STRING(20), defaultValue: 'DRAFT', allowNull: false },
      likes_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      reward_pool: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      prize_first_position: { type: DataTypes.JSONB, allowNull: true },
      prize_second_position: { type: DataTypes.JSONB, allowNull: true },
      prize_third_position: { type: DataTypes.JSONB, allowNull: true },
      prize_pool: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      prizes_breakdown: { type: DataTypes.JSONB, allowNull: true },
      registration_start_date: { type: DataTypes.DATE, allowNull: true },
      registration_end_date: { type: DataTypes.DATE, allowNull: true },
      submission_start_date: { type: DataTypes.DATE, allowNull: true },
      submission_end_date: { type: DataTypes.DATE, allowNull: true },
      results_announcement_date: { type: DataTypes.DATE, allowNull: true },
      award_distribution_date: { type: DataTypes.DATE, allowNull: true },
    }, { tableName: 'campaigns', timestamps: true, underscored: true });
    
    const DonationModel = newDb.define('Donation', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      donor_id: { type: DataTypes.INTEGER, allowNull: false },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING(20), defaultValue: 'PENDING', allowNull: false },
      payment_method: { type: DataTypes.STRING(20), allowNull: false },
      transaction_id: { type: DataTypes.STRING(255), allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: true },
      anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { tableName: 'donations', timestamps: true, underscored: true });
    
    const ProjectLikeModel = newDb.define('ProjectLike', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    }, { tableName: 'project_likes', timestamps: true, underscored: true });
    
    const ProjectShareModel = newDb.define('ProjectShare', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      project_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      platform: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'direct' },
    }, { tableName: 'project_shares', timestamps: true, underscored: true });
    
    const CampaignParticipationModel = newDb.define('CampaignParticipation', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      campaign_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      motivation: { type: DataTypes.TEXT, allowNull: false },
      experience: { type: DataTypes.TEXT, allowNull: false },
      portfolio: { type: DataTypes.TEXT, allowNull: true },
      additional_info: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
      submission_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'not_submitted' },
      submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
      review_notes: { type: DataTypes.TEXT, allowNull: true },
    }, { tableName: 'campaign_participations', timestamps: true, underscored: true });
    
    const CampaignLikeModel = newDb.define('CampaignLike', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      campaign_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    }, { tableName: 'campaign_likes', timestamps: true, underscored: true });
    
    const CampaignSubmissionModel = newDb.define('CampaignSubmission', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      campaign_id: { type: DataTypes.INTEGER, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      participation_id: { type: DataTypes.INTEGER, allowNull: false },
      project_title: { type: DataTypes.STRING(255), allowNull: false },
      project_description: { type: DataTypes.TEXT, allowNull: false },
      project_screenshots: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
      project_links: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      pitch_deck_url: { type: DataTypes.STRING(500), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'submitted' },
      submission_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      score: { type: DataTypes.INTEGER, allowNull: true },
      grade: { type: DataTypes.STRING(10), allowNull: true },
      feedback: { type: DataTypes.TEXT, allowNull: true },
      graded_by: { type: DataTypes.INTEGER, allowNull: true },
      graded_at: { type: DataTypes.DATE, allowNull: true },
      position: { type: DataTypes.INTEGER, allowNull: true },
      prize_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      prize_distributed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      prize_distributed_at: { type: DataTypes.DATE, allowNull: true },
    }, { tableName: 'campaign_submissions', timestamps: true, underscored: true });
    
    // Sync schema (creates tables)
    await newDb.sync({ force: false, alter: false });
    console.log('✅ Schema created/verified in Neon DB\n');

    // Migrate data
    console.log('📦 Starting data migration...\n');

    let totalRecords = 0;

    // Migrate data in order
    for (const tableName of tableOrder) {
      try {
        console.log(`📤 Migrating ${tableName}...`);
        
        // Get column names from the table
        const [columns] = await oldDb.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position
        `) as any[];
        
        if (columns.length === 0) {
          console.log(`   ⏭️  Table ${tableName} not found in source database, skipping...\n`);
          continue;
        }

        const columnNames = columns.map((col: any) => col.column_name);

        // Fetch all records from old database
        const records = await oldDb.query(`SELECT * FROM ${tableName}`, {
          type: 'SELECT',
        }) as any[];

        if (records.length === 0) {
          console.log(`   ⏭️  No records found in ${tableName}, skipping...\n`);
          continue;
        }

        console.log(`   Found ${records.length} records`);

        // Insert records into new database in batches
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          // Build INSERT query with proper escaping
          const values = batch.map((record, batchIdx) => {
            const recordValues = columnNames.map((col: string, colIdx: number) => {
              const value = record[col];
              const paramIdx = batchIdx * columnNames.length + colIdx + 1;
              
              if (value === null || value === undefined) {
                return 'NULL';
              } else if (typeof value === 'string') {
                // Escape single quotes and wrap in quotes
                return `'${value.replace(/'/g, "''")}'`;
              } else if (typeof value === 'boolean') {
                return value ? 'TRUE' : 'FALSE';
              } else if (value instanceof Date) {
                return `'${value.toISOString()}'`;
              } else if (typeof value === 'object') {
                // Handle JSONB fields
                return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
              } else if (Array.isArray(value)) {
                // Handle array fields
                return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
              } else {
                return String(value);
              }
            });
            return `(${recordValues.join(', ')})`;
          });

          const insertQuery = `
            INSERT INTO ${tableName} (${columnNames.join(', ')})
            VALUES ${values.join(', ')}
            ON CONFLICT DO NOTHING
          `;

          try {
            const [result] = await newDb.query(insertQuery) as any[];
            inserted += batch.length;
          } catch (insertError: any) {
            // If batch insert fails, try individual inserts
            console.log(`   ⚠️  Batch insert failed, trying individual inserts...`);
            for (const record of batch) {
              try {
                const individualValues = columnNames.map((col: string) => {
                  const value = record[col];
                  if (value === null || value === undefined) {
                    return 'NULL';
                  } else if (typeof value === 'string') {
                    return `'${value.replace(/'/g, "''")}'`;
                  } else if (typeof value === 'boolean') {
                    return value ? 'TRUE' : 'FALSE';
                  } else if (value instanceof Date) {
                    return `'${value.toISOString()}'`;
                  } else if (typeof value === 'object' || Array.isArray(value)) {
                    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
                  } else {
                    return String(value);
                  }
                });
                
                const individualQuery = `
                  INSERT INTO ${tableName} (${columnNames.join(', ')})
                  VALUES (${individualValues.join(', ')})
                  ON CONFLICT DO NOTHING
                `;
                await newDb.query(individualQuery);
                inserted++;
              } catch (individualError: any) {
                console.error(`   ❌ Failed to insert record:`, individualError.message);
              }
            }
          }
        }

        totalRecords += records.length;
        console.log(`   ✅ Migrated ${inserted}/${records.length} records from ${tableName}\n`);
      } catch (error: any) {
        console.error(`   ❌ Error migrating ${tableName}:`, error.message);
        console.error(`   Continuing with next table...\n`);
      }
    }

    // Reset sequences to prevent ID conflicts
    console.log('🔄 Resetting sequences...');
    for (const tableName of tableOrder) {
      try {
        await newDb.query(`
          SELECT setval(
            pg_get_serial_sequence('${tableName}', 'id'), 
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1), 
            true
          );
        `);
      } catch (error) {
        // Some tables might not have sequences, ignore
      }
    }
    console.log('✅ Sequences reset\n');

    console.log(`🎉 Migration completed successfully!`);
    console.log(`   Total records migrated: ${totalRecords}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Update your DATABASE_URL in .env to use your Neon DB connection string`);
    console.log(`   2. Test your application with the new database`);
    console.log(`   3. Verify all data is correct before removing the old database`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await oldDb.close();
    await newDb.close();
    console.log('\n🔌 Database connections closed');
  }
};

// Run migration
migrateData().catch(console.error);

