-- Add icon, color, and notes columns to habits table for Phase 5

ALTER TABLE habits
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎯',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN habits.icon IS 'Emoji icon for the habit (e.g., 💪, 🏃, 📚)';
COMMENT ON COLUMN habits.color IS 'Hex color code for the habit card (e.g., #3b82f6)';
COMMENT ON COLUMN habits.notes IS 'Additional notes about the habit, including AI suggestions and strategies';
