-- Create meeting_transcripts table
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT,
  duration_seconds INTEGER, -- NULL for imported transcripts
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE meeting_transcripts IS 'Stores meeting transcripts from live recording or import';
COMMENT ON COLUMN meeting_transcripts.duration_seconds IS 'Recording duration in seconds (NULL for imported transcripts)';
COMMENT ON COLUMN meeting_transcripts.word_count IS 'Number of words in transcript';
COMMENT ON COLUMN meeting_transcripts.summary IS 'AI-generated summary of the meeting';

-- Add meeting_id to tasks table to link tasks back to source meeting
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meeting_transcripts(id) ON DELETE SET NULL;

COMMENT ON COLUMN tasks.meeting_id IS 'Links task to the meeting transcript it was extracted from';

-- Enable Row Level Security
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_transcripts
CREATE POLICY "Users can view own transcripts"
  ON meeting_transcripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
  ON meeting_transcripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts"
  ON meeting_transcripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts"
  ON meeting_transcripts FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_user_id
  ON meeting_transcripts(user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_created_at
  ON meeting_transcripts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id
  ON tasks(meeting_id);
