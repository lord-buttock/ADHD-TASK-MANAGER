import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitService } from '../services/habitService'
import type { Database } from '../types/supabase'

type HabitInsert = Database['public']['Tables']['habits']['Insert']
type HabitUpdate = Database['public']['Tables']['habits']['Update']

const HABITS_QUERY_KEY = 'habits'

export function useHabits(userId: string) {
  return useQuery({
    queryKey: [HABITS_QUERY_KEY, userId],
    queryFn: () => habitService.getHabits(userId),
    enabled: !!userId,
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: [HABITS_QUERY_KEY, id],
    queryFn: () => habitService.getHabit(id),
    enabled: !!id,
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habit: HabitInsert) => habitService.createHabit(habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] })
    },
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: HabitUpdate }) =>
      habitService.updateHabit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] })
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [HABITS_QUERY_KEY] })

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData([HABITS_QUERY_KEY])

      // Optimistically update
      queryClient.setQueryData([HABITS_QUERY_KEY], (old: any) => {
        if (!old) return old
        return old.map((habit: any) => (habit.id === id ? { ...habit, ...updates } : habit))
      })

      return { previousHabits }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData([HABITS_QUERY_KEY], context.previousHabits)
      }
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitService.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] })
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [HABITS_QUERY_KEY] })

      // Snapshot previous value
      const previousHabits = queryClient.getQueryData([HABITS_QUERY_KEY])

      // Optimistically remove from list
      queryClient.setQueryData([HABITS_QUERY_KEY], (old: any) => {
        if (!old) return old
        return old.filter((habit: any) => habit.id !== id)
      })

      return { previousHabits }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData([HABITS_QUERY_KEY], context.previousHabits)
      }
    },
  })
}

export function useCompleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, userId }: { habitId: string; userId: string }) =>
      habitService.completeHabit(habitId, userId),
    onSuccess: (result, variables) => {
      // Force refetch to get updated streak values
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['habit-completions', variables.habitId] })
    },
  })
}

export function useIsCompletedToday(habitId: string, userId: string) {
  return useQuery({
    queryKey: ['habit-completions', habitId, 'today'],
    queryFn: () => habitService.isCompletedToday(habitId, userId),
    enabled: !!habitId && !!userId,
  })
}

export function useCompletionHistory(habitId: string, userId: string, days: number = 30) {
  return useQuery({
    queryKey: ['habit-completions', habitId, 'history', days],
    queryFn: () => habitService.getCompletionHistory(habitId, userId, days),
    enabled: !!habitId && !!userId,
  })
}

export function useCompletionStats(habitId: string, userId: string, days: number = 30) {
  return useQuery({
    queryKey: ['habit-completions', habitId, 'stats', days],
    queryFn: () => habitService.getCompletionStats(habitId, userId, days),
    enabled: !!habitId && !!userId,
  })
}
