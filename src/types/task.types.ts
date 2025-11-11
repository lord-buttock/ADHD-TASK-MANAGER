import type { Database } from './database.types'

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export interface NoteHistoryEntry {
  added_at: string
  content: string
  source: 'quick_note' | 'manual' | 'ai_merge'
}

export interface TaskMatch {
  task: Task
  similarity: number
  reasoning: string
}

export interface ParsedTask {
  title: string
  notes?: string
  urgent: boolean
  important: boolean
  area: 'work' | 'personal' | 'health' | 'social'
  estimated_minutes?: number
  due_date?: string
  reasoning?: string
}

export interface ParsedTaskWithMatches {
  parsedTask: ParsedTask
  matches: TaskMatch[]
  action?: 'create' | 'merge' // User's decision
  mergeIntoTaskId?: string // If action is 'merge', which task to merge into
}
