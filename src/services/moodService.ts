import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type MoodLog = Database['public']['Tables']['mood_logs']['Row']
type MoodLogInsert = Database['public']['Tables']['mood_logs']['Insert']

/**
 * Log current mood, energy, and stress levels
 */
export async function logMood(
  userId: string,
  mood: number,
  energy: number,
  stress: number,
  notes?: string
): Promise<MoodLog> {
  // Validate inputs
  if (mood < 1 || mood > 5 || energy < 1 || energy > 5 || stress < 1 || stress > 5) {
    throw new Error('Mood, energy, and stress must be between 1 and 5')
  }

  if (notes && notes.length > 500) {
    throw new Error('Notes must be 500 characters or less')
  }

  // Check rate limiting (max 20 logs per day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('mood_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('logged_at', today.toISOString())

  if (count && count >= 20) {
    throw new Error('Maximum 20 mood logs per day')
  }

  // Insert mood log
  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: userId,
      mood,
      energy,
      stress,
      notes: notes || null,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get mood logs for a user within a date range
 */
export async function getMoodLogs(
  userId: string,
  days: number = 30
): Promise<MoodLog[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get the most recent mood log
 */
export async function getLatestMoodLog(userId: string): Promise<MoodLog | null> {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Calculate mood logging streak (consecutive days with at least one log)
 */
export async function calculateMoodStreak(userId: string): Promise<number> {
  // Get all mood logs ordered by date
  const { data: logs, error } = await supabase
    .from('mood_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  if (!logs || logs.length === 0) return 0

  // Get unique dates
  const uniqueDates = Array.from(
    new Set(logs.map((log) => new Date(log.logged_at).toDateString()))
  )

  // Calculate streak
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const dateStr of uniqueDates) {
    const logDate = new Date(dateStr)
    logDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor(
      (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === streak) {
      streak++
      currentDate = logDate
    } else {
      break
    }
  }

  return streak
}

/**
 * Get average mood, energy, and stress over a period
 */
export async function getMoodAverages(
  userId: string,
  days: number = 30
): Promise<{
  mood: number
  energy: number
  stress: number
  count: number
}> {
  const logs = await getMoodLogs(userId, days)

  if (logs.length === 0) {
    return { mood: 0, energy: 0, stress: 0, count: 0 }
  }

  const totals = logs.reduce(
    (acc, log) => ({
      mood: acc.mood + log.mood,
      energy: acc.energy + log.energy,
      stress: acc.stress + log.stress,
    }),
    { mood: 0, energy: 0, stress: 0 }
  )

  return {
    mood: Math.round((totals.mood / logs.length) * 10) / 10,
    energy: Math.round((totals.energy / logs.length) * 10) / 10,
    stress: Math.round((totals.stress / logs.length) * 10) / 10,
    count: logs.length,
  }
}

/**
 * Get mood trends comparison between two periods
 */
export async function getMoodTrends(
  userId: string,
  currentDays: number = 30
): Promise<{
  current: { mood: number; energy: number; stress: number }
  previous: { mood: number; energy: number; stress: number }
  changes: { mood: number; energy: number; stress: number }
}> {
  const current = await getMoodAverages(userId, currentDays)

  // Get previous period (same length, before current period)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (currentDays * 2))
  const endDate = new Date()
  endDate.setDate(endDate.getDate() - currentDays)

  const { data: previousLogs } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startDate.toISOString())
    .lt('logged_at', endDate.toISOString())

  const previous =
    previousLogs && previousLogs.length > 0
      ? {
          mood: Math.round((previousLogs.reduce((sum, l) => sum + l.mood, 0) / previousLogs.length) * 10) / 10,
          energy: Math.round((previousLogs.reduce((sum, l) => sum + l.energy, 0) / previousLogs.length) * 10) / 10,
          stress: Math.round((previousLogs.reduce((sum, l) => sum + l.stress, 0) / previousLogs.length) * 10) / 10,
        }
      : { mood: 0, energy: 0, stress: 0 }

  return {
    current: { mood: current.mood, energy: current.energy, stress: current.stress },
    previous,
    changes: {
      mood: Math.round((current.mood - previous.mood) * 10) / 10,
      energy: Math.round((current.energy - previous.energy) * 10) / 10,
      stress: Math.round((current.stress - previous.stress) * 10) / 10,
    },
  }
}

export const moodService = {
  logMood,
  getMoodLogs,
  getLatestMoodLog,
  calculateMoodStreak,
  getMoodAverages,
  getMoodTrends,
}
