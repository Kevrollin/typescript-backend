-- Add registration period fields to campaigns table
-- This migration adds registration_start_date and registration_end_date columns

-- Add registration period columns
ALTER TABLE campaigns 
ADD COLUMN registration_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN registration_end_date TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN campaigns.registration_start_date IS 'Start date for campaign registration period';
COMMENT ON COLUMN campaigns.registration_end_date IS 'End date for campaign registration period';
COMMENT ON COLUMN campaigns.submission_start_date IS 'Start date for project submission period';
COMMENT ON COLUMN campaigns.submission_end_date IS 'End date for project submission period';
COMMENT ON COLUMN campaigns.results_announcement_date IS 'Date when campaign results will be announced';
COMMENT ON COLUMN campaigns.award_distribution_date IS 'Date when awards will be distributed';
