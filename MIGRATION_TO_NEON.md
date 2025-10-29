# Migration Guide: Local PostgreSQL to Neon DB

This guide will help you migrate your database from local PostgreSQL to Neon DB (serverless PostgreSQL).

## Prerequisites

1. **Neon DB Account**: Sign up at [neon.tech](https://neon.tech) if you haven't already
2. **Create Neon Database**: 
   - Log in to Neon console
   - Create a new project and database
   - Copy your connection string (it will look like: `postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require`)

## Migration Steps

### Step 1: Prepare Environment Variables

Create or update your `.env.local` file in the `typescript-backend` directory:

```bash
# Old database (your local PostgreSQL)
OLD_DATABASE_URL=postgresql://user:password@localhost:5432/fundhub

# New database (your Neon DB connection string)
NEW_DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Important**: Replace the placeholders with your actual connection strings.

### Step 2: Install Dependencies

Make sure all dependencies are installed:

```bash
cd typescript-backend
npm install
```

### Step 3: Run Migration Script

Execute the migration script:

```bash
npm run migrate:neon
```

The script will:
1. ✅ Connect to both databases
2. ✅ Create all necessary tables in Neon DB (if they don't exist)
3. ✅ Migrate all data from local PostgreSQL to Neon DB
4. ✅ Migrate data in the correct order (respecting foreign key dependencies)
5. ✅ Reset sequences to prevent ID conflicts
6. ✅ Provide a summary of migrated records

### Step 4: Verify Migration

After migration completes, verify your data:

1. **Check the migration output** - It will show how many records were migrated from each table
2. **Test your application** - Update your `.env` file temporarily to use `NEW_DATABASE_URL` and test your app
3. **Verify in Neon Console** - Check the Neon console to see your tables and data

### Step 5: Update Configuration

Once you've verified the migration:

1. **Update your `.env` file** to use the Neon DB connection string:
   ```bash
   DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

2. **Remove migration variables** (optional):
   - Remove `OLD_DATABASE_URL` and `NEW_DATABASE_URL` from `.env.local` if you no longer need them

3. **Restart your application** to use the new database

## Migration Order

The script migrates tables in the following order (respecting foreign key dependencies):

1. `users` - Base user data
2. `students` - Student profiles (depends on users)
3. `projects` - Projects (depends on users)
4. `campaigns` - Campaigns (depends on users)
5. `donations` - Donations (depends on users and projects)
6. `project_likes` - Project likes (depends on users and projects)
7. `project_shares` - Project shares (depends on users and projects)
8. `campaign_participations` - Campaign participations (depends on users and campaigns)
9. `campaign_likes` - Campaign likes (depends on users and campaigns)
10. `campaign_submissions` - Campaign submissions (depends on users, campaigns, and participations)

## Troubleshooting

### Connection Issues

**Error: "Unable to connect to the database"**

- Verify your connection strings are correct
- Check that your local PostgreSQL is running
- Ensure your Neon DB is accessible (check firewall settings)
- Verify SSL settings (Neon requires SSL)

**Error: "SSL connection required"**

- Neon DB requires SSL connections
- Make sure your `NEW_DATABASE_URL` includes `?sslmode=require`
- The migration script automatically enables SSL for Neon connections

### Data Migration Issues

**Error: "Foreign key constraint violation"**

- The script migrates tables in the correct order, but if you see this error:
  - Check that all parent records exist (e.g., users before projects)
  - Some data might be orphaned in your source database

**Error: "Duplicate key violation"**

- The script uses `ON CONFLICT DO NOTHING` to handle duplicates
- If you're seeing duplicate errors, there might be a unique constraint issue
- Check the error message for the specific table and column

**Migration appears stuck**

- Large databases might take time
- Check the console output for progress
- The script processes data in batches of 100 records

### Schema Issues

**Error: "Table does not exist"**

- The script creates tables automatically using Sequelize sync
- If tables aren't created, check:
  - Sequelize model definitions match your schema
  - Database permissions allow table creation

## Database Configuration

The application automatically detects Neon DB connections and enables SSL. The configuration in `src/config/database.ts` checks for:
- Connection strings containing `neon.tech`
- Production environment

SSL is automatically enabled for Neon connections.

## Rollback

If you need to rollback:

1. Keep your local PostgreSQL database running
2. Update `DATABASE_URL` back to your local connection string
3. Your application will revert to using local PostgreSQL

## After Migration

Once migration is complete and verified:

1. ✅ Update production environment variables
2. ✅ Test all application features
3. ✅ Monitor application logs for any database connection issues
4. ✅ Consider setting up database backups in Neon console
5. ✅ (Optional) Keep local database as backup for a period

## Support

If you encounter issues:

1. Check the migration script output for specific error messages
2. Verify your connection strings
3. Check Neon DB status in the Neon console
4. Review logs for detailed error information

## Notes

- The migration script does NOT delete data from your local database
- Migration is safe to run multiple times (uses `ON CONFLICT DO NOTHING`)
- Large databases may take significant time to migrate
- All timestamps and data types are preserved during migration
- JSONB fields are properly handled

