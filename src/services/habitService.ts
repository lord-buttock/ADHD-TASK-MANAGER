import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type Habit = Database['public']['Tables']['habits']['Row']
type HabitInsert = Database['public']['Tables']['habits']['Insert']
type HabitUpdate = Database['public']['Tables']['habits']['Update']
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']

/**
 * Calculate consecutive streak for a habit based on completion history
 */
export async function calculateStreak(
  habitId: string,
  _userId: string
): Promise<{ currentStreak: number; recordStreak: number }> {
  // Fetch all completions for habit, ordered by date DESC
  const { data: completions, error } = await supabase
    .from('habit_completions')
    .select('completed_at')
    .eq('habit_id', habitId)
    .order('completed_at', { ascending: false })

  if (error) throw error

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0) // Start of today

  // Calculate current streak
  for (const completion of completions || []) {
    const completionDate = new Date(completion.completed_at)
    completionDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor(
      (currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === streak) {
      streak++
      currentDate = completionDate
    } else {
      break // Gap found, streak ends
    }
  }

  // Get current record from database
  const { data: habit } = await supabase
    .from('habits')
    .select('record_streak')
    .eq('id', habitId)
    .single()

  const currentRecord = habit?.record_streak || 0
  const newRecord = Math.max(streak, currentRecord)

  return { currentStreak: streak, recordStreak: newRecord }
}

/**
 * Check if habit was completed today
 */
export async function isCompletedToday(habitId: string, _userId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .gte('completed_at', today.toISOString())
    .maybeSingle()

  if (error) throw error
  return !!data
}

/**
 * Get all active habits for the current user
 */
export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get habit by ID
 */
export async function getHabit(id: string): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new habit
 */
export async function createHabit(habit: HabitInsert): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert({
      ...habit,
      current_streak: 0,
      record_streak: 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a habit
 */
export async function updateHabit(id: string, updates: HabitUpdate): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a habit (set is_active to false)
 */
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase
    .from('habits')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * Complete a habit for today
 */
export async function completeHabit(
  habitId: string,
  userId: string
): Promise<{ success: boolean; message: string; newStreak: number; isNewRecord: boolean }> {
  // Check if already completed today
  const alreadyCompleted = await isCompletedToday(habitId, userId)
  if (alreadyCompleted) {
    return {
      success: false,
      message: 'Already completed today!',
      newStreak: 0,
      isNewRecord: false,
    }
  }

  // Insert completion record
  const { error: insertError } = await supabase.from('habit_completions').insert({
    habit_id: habitId,
    completed_at: new Date().toISOString().split('T')[0], // Date only (YYYY-MM-DD)
  })

  if (insertError) throw insertError

  // Calculate new streak
  const { currentStreak, recordStreak } = await calculateStreak(habitId, userId)

  // Check if it's a new record
  const { data: habit } = await supabase
    .from('habits')
    .select('record_streak')
    .eq('id', habitId)
    .single()

  const isNewRecord = currentStreak > (habit?.record_streak || 0)

  // Update habit with new streak values
  await supabase
    .from('habits')
    .update({
      current_streak: currentStreak,
      record_streak: recordStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)

  return {
    success: true,
    message: 'Habit completed!',
    newStreak: currentStreak,
    isNewRecord,
  }
}

/**
 * Get completion history for a habit
 */
export async function getCompletionHistory(
  habitId: string,
  _userId: string,
  days: number = 30
): Promise<HabitCompletion[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .gte('completed_at', startDate.toISOString())
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get completion statistics for a habit
 */
export async function getCompletionStats(
  habitId: string,
  userId: string,
  days: number = 30
): Promise<{
  completedDays: number
  totalDays: number
  percentage: number
  completionDates: string[]
}> {
  const history = await getCompletionHistory(habitId, userId, days)

  const completionDates = history.map((h) => {
    const date = new Date(h.completed_at)
    date.setHours(0, 0, 0, 0)
    return date.toISOString().split('T')[0]
  })

  // Remove duplicates (in case of multiple completions per day)
  const uniqueDates = Array.from(new Set(completionDates))

  return {
    completedDays: uniqueDates.length,
    totalDays: days,
    percentage: Math.round((uniqueDates.length / days) * 100),
    completionDates: uniqueDates,
  }
}

/**
 * Restore a deleted habit
 */
export async function restoreHabit(id: string): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const habitService = {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  isCompletedToday,
  calculateStreak,
  getCompletionHistory,
  getCompletionStats,
  restoreHabit,
}
