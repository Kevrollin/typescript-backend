-- Migration: Add banner image and screenshots to projects table
-- This migration adds banner_image and screenshots fields for the carousel functionality

-- Add banner_image column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS banner_image VARCHAR(500);

-- Add screenshots column as JSON array to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]'::jsonb;

-- Update existing projects to use imageUrl as banner_image
UPDATE projects 
SET banner_image = image_url 
WHERE image_url IS NOT NULL AND banner_image IS NULL;

-- Add some sample screenshots to existing projects for testing
UPDATE projects 
SET screenshots = '[
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500",
  "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500"
]'::jsonb
WHERE title = 'AI-Powered Study Assistant';

UPDATE projects 
SET screenshots = '[
  "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=500",
  "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=500",
  "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500"
]'::jsonb
WHERE title = 'Sustainable Energy Monitor';

UPDATE projects 
SET screenshots = '[
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500",
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500"
]'::jsonb
WHERE title = 'Community Garden App';

UPDATE projects 
SET screenshots = '[
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500"
]'::jsonb
WHERE title = 'Mental Health Support Platform';

UPDATE projects 
SET screenshots = '[
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500",
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500"
]'::jsonb
WHERE title = 'Digital Art Gallery';

-- Create index for better performance on screenshots queries
CREATE INDEX IF NOT EXISTS idx_projects_screenshots ON projects USING GIN (screenshots);
