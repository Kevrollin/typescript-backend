-- Adds optional URL fields to projects for repository, demo and website
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS repo_url TEXT,
  ADD COLUMN IF NOT EXISTS demo_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;


