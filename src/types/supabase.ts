// Re-export Database types from database.types.ts
// This file exists for backwards compatibility with imports from '../types/supabase'
export type { Database, Json } from './database.types'

// Helper type to get table row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Import the Database type
import type { Database } from './database.types'

// Export specific table types for convenience
export type Task = Database['public']['Tables']['tasks']['Row']
export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']
export type QuickNote = Database['public']['Tables']['quick_notes']['Row']
export type MoodLog = Database['public']['Tables']['mood_logs']['Row']
export type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']
