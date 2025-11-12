import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moodService } from '../services/moodService'
import type { Database } from '../types/supabase'

type MoodLog = Database['public']['Tables']['mood_logs']['Row']

const MOOD_LOGS_QUERY_KEY = 'mood_logs'

/**
 * Fetch mood logs for a user within a date range
 */
export function useMoodLogs(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [MOOD_LOGS_QUERY_KEY, userId, days],
    queryFn: () => moodService.getMoodLogs(userId, days),
    enabled: !!userId,
  })
}

/**
 * Get the most recent mood log
 */
export function useLatestMoodLog(userId: string) {
  return useQuery({
    queryKey: [MOOD_LOGS_QUERY_KEY, 'latest', userId],
    queryFn: () => moodService.getLatestMoodLog(userId),
    enabled: !!userId,
  })
}

/**
 * Calculate and fetch mood logging streak
 */
export function useMoodStreak(userId: string) {
  return useQuery({
    queryKey: [MOOD_LOGS_QUERY_KEY, 'streak', userId],
    queryFn: () => moodService.calculateMoodStreak(userId),
    enabled: !!userId,
  })
}

/**
 * Get mood averages over a period
 */
export function useMoodAverages(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [MOOD_LOGS_QUERY_KEY, 'averages', userId, days],
    queryFn: () => moodService.getMoodAverages(userId, days),
    enabled: !!userId,
  })
}

/**
 * Get mood trends comparison
 */
export function useMoodTrends(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [MOOD_LOGS_QUERY_KEY, 'trends', userId, days],
    queryFn: () => moodService.getMoodTrends(userId, days),
    enabled: !!userId,
  })
}

/**
 * Mutation to log current mood
 */
export function useLogMood() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      mood,
      energy,
      stress,
      notes,
    }: {
      userId: string
      mood: number
      energy: number
      stress: number
      notes?: string
    }) => moodService.logMood(userId, mood, energy, stress, notes),
    onSuccess: (data, variables) => {
      // Invalidate all mood-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: [MOOD_LOGS_QUERY_KEY] })
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [MOOD_LOGS_QUERY_KEY, variables.userId],
      })

      // Snapshot previous values
      const previousLogs = queryClient.getQueryData([
        MOOD_LOGS_QUERY_KEY,
        variables.userId,
        30,
      ])
      const previousLatest = queryClient.getQueryData([
        MOOD_LOGS_QUERY_KEY,
        'latest',
        variables.userId,
      ])

      // Optimistically update latest log
      const optimisticLog: Partial<MoodLog> = {
        user_id: variables.userId,
        mood: variables.mood,
        energy: variables.energy,
        stress: variables.stress,
        notes: variables.notes || null,
        logged_at: new Date().toISOString(),
      }

      queryClient.setQueryData(
        [MOOD_LOGS_QUERY_KEY, 'latest', variables.userId],
        optimisticLog
      )

      return { previousLogs, previousLatest }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLogs) {
        queryClient.setQueryData(
          [MOOD_LOGS_QUERY_KEY, variables.userId, 30],
          context.previousLogs
        )
      }
      if (context?.previousLatest) {
        queryClient.setQueryData(
          [MOOD_LOGS_QUERY_KEY, 'latest', variables.userId],
          context.previousLatest
        )
      }
    },
  })
}
