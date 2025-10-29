-- Add social URL fields to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS github_url VARCHAR(500);


