-- Migration: Add engagement fields to projects table
-- This migration adds likes_count, shares_count, and views_count to the projects table

-- Add new columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;

-- Create project_likes table
CREATE TABLE IF NOT EXISTS project_likes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to project_likes table
DROP TRIGGER IF EXISTS update_project_likes_updated_at ON project_likes;
CREATE TRIGGER update_project_likes_updated_at
    BEFORE UPDATE ON project_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing projects to have default values
UPDATE projects 
SET 
    likes_count = 0,
    shares_count = 0,
    views_count = 0
WHERE 
    likes_count IS NULL 
    OR shares_count IS NULL 
    OR views_count IS NULL;
