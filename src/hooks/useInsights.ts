import { useQuery } from '@tanstack/react-query'
import { insightsService } from '../services/insightsService'

const INSIGHTS_QUERY_KEY = 'insights'

/**
 * Get productivity by hour analytics
 */
export function useProductivityByHour(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [INSIGHTS_QUERY_KEY, 'productivity-by-hour', userId, days],
    queryFn: () => insightsService.getProductivityByHour(userId, days),
    enabled: !!userId,
  })
}

/**
 * Get completion by day of week analytics
 */
export function useCompletionByDay(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [INSIGHTS_QUERY_KEY, 'completion-by-day', userId, days],
    queryFn: () => insightsService.getCompletionByDay(userId, days),
    enabled: !!userId,
  })
}

/**
 * Get habit success rates
 */
export function useHabitSuccessRates(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [INSIGHTS_QUERY_KEY, 'habit-success-rates', userId, days],
    queryFn: () => insightsService.getHabitSuccessRates(userId, days),
    enabled: !!userId,
  })
}

/**
 * Get correlation insights between mood and productivity
 */
export function useCorrelationInsights(userId: string, days: number = 30) {
  return useQuery({
    queryKey: [INSIGHTS_QUERY_KEY, 'correlations', userId, days],
    queryFn: () => insightsService.getCorrelationInsights(userId, days),
    enabled: !!userId,
  })
}
