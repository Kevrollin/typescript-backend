-- Add submission-related fields to campaigns table
ALTER TABLE campaigns ADD COLUMN submission_start_date TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN submission_end_date TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN results_announcement_date TIMESTAMP;
ALTER TABLE campaigns ADD COLUMN award_distribution_date TIMESTAMP;

-- Create campaign_submissions table
CREATE TABLE campaign_submissions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participation_id INTEGER NOT NULL REFERENCES campaign_participations(id) ON DELETE CASCADE,
    
    -- Project details
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT NOT NULL,
    project_screenshots TEXT[], -- Array of image URLs
    project_links JSONB, -- JSON object with demo_url, github_url, files_url
    pitch_deck_url VARCHAR(500), -- PDF file URL
    
    -- Submission status
    status VARCHAR(20) NOT NULL DEFAULT 'submitted', -- submitted, under_review, graded, winner, runner_up, not_selected
    submission_date TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Grading fields
    score INTEGER, -- Overall score out of 100
    grade VARCHAR(10), -- A+, A, B+, B, C+, C, D, F
    feedback TEXT,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP,
    
    -- Award information
    position INTEGER, -- 1st, 2nd, 3rd place
    prize_amount DECIMAL(15, 2),
    prize_distributed BOOLEAN DEFAULT FALSE,
    prize_distributed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure one submission per participation
    UNIQUE(participation_id)
);

-- Create indexes for better performance
CREATE INDEX idx_campaign_submissions_campaign_id ON campaign_submissions(campaign_id);
CREATE INDEX idx_campaign_submissions_user_id ON campaign_submissions(user_id);
CREATE INDEX idx_campaign_submissions_status ON campaign_submissions(status);
CREATE INDEX idx_campaign_submissions_submission_date ON campaign_submissions(submission_date);

-- Add submission status to campaign_participations table
ALTER TABLE campaign_participations ADD COLUMN submission_status VARCHAR(20) DEFAULT 'not_submitted';
-- Values: not_submitted, submitted, under_review, graded, winner, runner_up, not_selected

-- Update the submission_status based on campaign_submissions
UPDATE campaign_participations 
SET submission_status = 'submitted' 
WHERE id IN (
    SELECT participation_id 
    FROM campaign_submissions 
    WHERE campaign_submissions.participation_id = campaign_participations.id
);

-- Add trigger to update submission_status when campaign_submissions change
CREATE OR REPLACE FUNCTION update_participation_submission_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE campaign_participations 
        SET submission_status = 'submitted' 
        WHERE id = NEW.participation_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE campaign_participations 
        SET submission_status = NEW.status 
        WHERE id = NEW.participation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE campaign_participations 
        SET submission_status = 'not_submitted' 
        WHERE id = OLD.participation_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_participation_submission_status
    AFTER INSERT OR UPDATE OR DELETE ON campaign_submissions
    FOR EACH ROW EXECUTE FUNCTION update_participation_submission_status();
