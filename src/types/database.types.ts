export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          notes: string | null
          status: 'todo' | 'in-progress' | 'done'
          urgent: boolean
          important: boolean
          estimated_minutes: number | null
          area: 'work' | 'personal' | 'health' | 'social'
          due_date: string | null
          created_at: string
          updated_at: string
          is_pinned: boolean
          completed_at: string | null
          note_history: Json
          meeting_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          notes?: string | null
          status?: 'todo' | 'in-progress' | 'done'
          urgent?: boolean
          important?: boolean
          estimated_minutes?: number | null
          area?: 'work' | 'personal' | 'health' | 'social'
          due_date?: string | null
          created_at?: string
          updated_at?: string
          is_pinned?: boolean
          completed_at?: string | null
          note_history?: Json
          meeting_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          notes?: string | null
          status?: 'todo' | 'in-progress' | 'done'
          urgent?: boolean
          important?: boolean
          estimated_minutes?: number | null
          area?: 'work' | 'personal' | 'health' | 'social'
          due_date?: string | null
          created_at?: string
          updated_at?: string
          is_pinned?: boolean
          completed_at?: string | null
          note_history?: Json
          meeting_id?: string | null
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          frequency: 'daily' | 'weekly'
          current_streak: number
          record_streak: number
          created_at: string
          updated_at: string
          is_active: boolean
          icon: string | null
          color: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          frequency: 'daily' | 'weekly'
          current_streak?: number
          record_streak?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          icon?: string | null
          color?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          frequency?: 'daily' | 'weekly'
          current_streak?: number
          record_streak?: number
          created_at?: string
          updated_at?: string
          is_active?: boolean
          icon?: string | null
          color?: string | null
          notes?: string | null
        }
      }
      habit_completions: {
        Row: {
          id: string
          habit_id: string
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          completed_at?: string
          created_at?: string
        }
      }
      quick_notes: {
        Row: {
          id: string
          user_id: string
          content: string
          processed: boolean
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          processed?: boolean
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          processed?: boolean
          created_at?: string
          processed_at?: string | null
        }
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          mood: number
          energy: number
          stress: number
          notes: string | null
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: number
          energy: number
          stress: number
          notes?: string | null
          logged_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: number
          energy?: number
          stress?: number
          notes?: string | null
          logged_at?: string
        }
      }
      meeting_transcripts: {
        Row: {
          id: string
          user_id: string
          title: string | null
          transcript: string
          summary: string | null
          duration_seconds: number | null
          created_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          transcript: string
          summary?: string | null
          duration_seconds?: number | null
          created_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          transcript?: string
          summary?: string | null
          duration_seconds?: number | null
          created_at?: string
          notes?: string | null
        }
      }
    }
  }
}
