-- Migration script to add likes functionality to campaigns
-- Run this script on your PostgreSQL database

-- Add likes_count column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- Create campaign_likes table
CREATE TABLE IF NOT EXISTS campaign_likes (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_campaign_user_like UNIQUE (campaign_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_likes_campaign_id ON campaign_likes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_likes_user_id ON campaign_likes(user_id);

-- Update existing campaigns to have 0 likes if they don't have the field
UPDATE campaigns SET likes_count = 0 WHERE likes_count IS NULL;
