-- Add notes column to meeting_transcripts table for user's personal notes
ALTER TABLE meeting_transcripts
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN meeting_transcripts.notes IS 'User''s personal notes about the meeting';
