import type { Database } from './database.types'

export type MoodLog = Database['public']['Tables']['mood_logs']['Row']
export type MoodLogInsert = Database['public']['Tables']['mood_logs']['Insert']
export type MoodLogUpdate = Database['public']['Tables']['mood_logs']['Update']
