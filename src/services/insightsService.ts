// @ts-nocheck
import { supabase } from '../lib/supabase'
import type { Database } from '../types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
type Habit = Database['public']['Tables']['habits']['Row']
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']

/**
 * Get task completions grouped by hour of day
 */
export async function getProductivityByHour(
  userId: string,
  days: number = 30
): Promise<{
  hourlyData: Array<{
    hour: number
    urgentImportant: number
    important: number
    other: number
    total: number
  }>
  peakHours: number[]
  insights: string[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', startDate.toISOString())

  if (error) throw error

  // Initialize hourly data (0-23)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    urgentImportant: 0,
    important: 0,
    other: 0,
    total: 0,
  }))

  // Count tasks by hour and priority
  tasks?.forEach((task) => {
    if (!task.completed_at) return

    const hour = new Date(task.completed_at).getHours()
    const data = hourlyData[hour]

    if (task.urgent && task.important) {
      data.urgentImportant++
    } else if (task.important) {
      data.important++
    } else {
      data.other++
    }

    data.total++
  })

  // Find peak hours (top 3)
  const peakHours = [...hourlyData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((d) => d.hour)
    .sort((a, b) => a - b)

  // Generate insights
  const insights: string[] = []

  if (tasks && tasks.length > 0) {
    // Most productive time
    const mostProductiveHour = hourlyData.reduce((max, curr) =>
      curr.total > max.total ? curr : max
    )
    if (mostProductiveHour.total > 0) {
      const timeStr = formatHour(mostProductiveHour.hour)
      insights.push(`Your peak productivity is around ${timeStr}`)
    }

    // Morning vs afternoon vs evening
    const morning = hourlyData.slice(6, 12).reduce((sum, h) => sum + h.total, 0)
    const afternoon = hourlyData.slice(12, 18).reduce((sum, h) => sum + h.total, 0)
    const evening = hourlyData.slice(18, 24).reduce((sum, h) => sum + h.total, 0)

    const timePreference =
      morning > afternoon && morning > evening
        ? 'morning'
        : afternoon > evening
        ? 'afternoon'
        : 'evening'

    insights.push(`You complete most tasks in the ${timePreference}`)

    // Urgent task timing
    const urgentTotal = hourlyData.reduce((sum, h) => sum + h.urgentImportant, 0)
    if (urgentTotal > tasks.length * 0.3) {
      insights.push('Try scheduling urgent tasks during your peak hours')
    }
  }

  return { hourlyData, peakHours, insights }
}

/**
 * Get task completions grouped by day of week
 */
export async function getCompletionByDay(
  userId: string,
  days: number = 30
): Promise<{
  dailyData: Array<{
    day: string
    completed: number
    avgPerDay: number
  }>
  bestDay: string
  worstDay: string
  insights: string[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', startDate.toISOString())

  if (error) throw error

  // Initialize daily data
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dailyCounts = Array(7).fill(0)
  const dayOccurrences = Array(7).fill(0)

  // Count tasks by day of week
  tasks?.forEach((task) => {
    if (!task.completed_at) return
    const dayIndex = new Date(task.completed_at).getDay()
    dailyCounts[dayIndex]++
  })

  // Count how many times each day appears in the range
  const current = new Date(startDate)
  const end = new Date()
  while (current <= end) {
    dayOccurrences[current.getDay()]++
    current.setDate(current.getDate() + 1)
  }

  // Calculate averages
  const dailyData = dayNames.map((day, i) => ({
    day,
    completed: dailyCounts[i],
    avgPerDay: dayOccurrences[i] > 0 ? dailyCounts[i] / dayOccurrences[i] : 0,
  }))

  // Find best and worst days
  const sortedByAvg = [...dailyData].sort((a, b) => b.avgPerDay - a.avgPerDay)
  const bestDay = sortedByAvg[0]?.day || 'N/A'
  const worstDay = sortedByAvg[sortedByAvg.length - 1]?.day || 'N/A'

  // Generate insights
  const insights: string[] = []

  if (tasks && tasks.length > 0) {
    insights.push(`${bestDay} is your most productive day`)

    // Weekday vs weekend
    const weekdayTotal = dailyCounts.slice(1, 6).reduce((sum, count) => sum + count, 0)
    const weekendTotal = dailyCounts[0] + dailyCounts[6]
    const weekdayAvg = weekdayTotal / 5
    const weekendAvg = weekendTotal / 2

    if (weekdayAvg > weekendAvg * 1.5) {
      insights.push('You\'re much more productive on weekdays')
    } else if (weekendAvg > weekdayAvg) {
      insights.push('You get more done on weekends - consider balancing your week')
    }

    // Low productivity warning
    if (sortedByAvg[sortedByAvg.length - 1]?.avgPerDay < 1) {
      insights.push(`${worstDay}s tend to be slow - try scheduling easier tasks`)
    }
  }

  return { dailyData, bestDay, worstDay, insights }
}

/**
 * Get habit completion rates and success percentages
 */
export async function getHabitSuccessRates(
  userId: string,
  days: number = 30
): Promise<{
  habitStats: Array<{
    id: string
    name: string
    icon: string
    color: string
    completions: number
    possibleDays: number
    successRate: number
    currentStreak: number
  }>
  overallRate: number
  insights: string[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get all active habits
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (habitsError) throw habitsError

  if (!habits || habits.length === 0) {
    return {
      habitStats: [],
      overallRate: 0,
      insights: ['Start tracking habits to see your success rates'],
    }
  }

  // Get completions for all habits in the date range
  const { data: completions, error: completionsError } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_at')
    .in(
      'habit_id',
      habits.map((h) => h.id)
    )
    .gte('completed_at', startDate.toISOString().split('T')[0])

  if (completionsError) throw completionsError

  // Calculate stats for each habit
  const habitStats = habits.map((habit) => {
    const habitCompletions = completions?.filter((c) => c.habit_id === habit.id) || []
    const possibleDays = days
    const successRate = (habitCompletions.length / possibleDays) * 100

    return {
      id: habit.id,
      name: habit.name,
      icon: habit.icon || '🎯',
      color: habit.color || '#3b82f6',
      completions: habitCompletions.length,
      possibleDays,
      successRate: Math.round(successRate * 10) / 10,
      currentStreak: habit.current_streak,
    }
  })

  // Sort by success rate
  habitStats.sort((a, b) => b.successRate - a.successRate)

  // Calculate overall rate
  const totalCompletions = habitStats.reduce((sum, h) => sum + h.completions, 0)
  const totalPossible = habitStats.reduce((sum, h) => sum + h.possibleDays, 0)
  const overallRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0

  // Generate insights
  const insights: string[] = []

  const excellentHabits = habitStats.filter((h) => h.successRate >= 90)
  const strugglingHabits = habitStats.filter((h) => h.successRate < 50)

  if (excellentHabits.length > 0) {
    insights.push(
      `${excellentHabits.length} ${excellentHabits.length === 1 ? 'habit' : 'habits'} with 90%+ completion - great work!`
    )
  }

  if (strugglingHabits.length > 0) {
    insights.push(
      `${strugglingHabits.length} ${strugglingHabits.length === 1 ? 'habit needs' : 'habits need'} attention - consider making them easier`
    )
  }

  if (overallRate >= 80) {
    insights.push('Outstanding consistency across all habits!')
  } else if (overallRate >= 60) {
    insights.push('Good progress - keep building momentum')
  } else if (overallRate < 40) {
    insights.push('Focus on 1-2 key habits to build consistency')
  }

  return { habitStats, overallRate: Math.round(overallRate * 10) / 10, insights }
}

/**
 * Get correlation insights between mood and productivity
 */
export async function getCorrelationInsights(
  userId: string,
  days: number = 30
): Promise<{
  correlations: {
    moodVsProductivity: number
    energyVsProductivity: number
    stressVsProductivity: number
  }
  insights: string[]
}> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get mood logs
  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true })

  // Get completed tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('completed_at', startDate.toISOString())

  const insights: string[] = []

  if (!moodLogs || moodLogs.length === 0 || !tasks || tasks.length === 0) {
    insights.push('Log more mood data to see correlations with productivity')
    return {
      correlations: {
        moodVsProductivity: 0,
        energyVsProductivity: 0,
        stressVsProductivity: 0,
      },
      insights,
    }
  }

  // Group tasks by day
  const tasksByDay: Record<string, number> = {}
  tasks.forEach((task) => {
    if (!task.completed_at) return
    const day = task.completed_at.split('T')[0]
    tasksByDay[day] = (tasksByDay[day] || 0) + 1
  })

  // Group mood logs by day (average if multiple)
  const moodByDay: Record<string, { mood: number; energy: number; stress: number }> = {}
  moodLogs.forEach((log) => {
    const day = log.logged_at.split('T')[0]
    if (!moodByDay[day]) {
      moodByDay[day] = { mood: log.mood, energy: log.energy, stress: log.stress }
    } else {
      // Average multiple logs on same day
      moodByDay[day].mood = (moodByDay[day].mood + log.mood) / 2
      moodByDay[day].energy = (moodByDay[day].energy + log.energy) / 2
      moodByDay[day].stress = (moodByDay[day].stress + log.stress) / 2
    }
  })

  // Calculate simple correlations (days with both mood and task data)
  const correlationData: Array<{
    mood: number
    energy: number
    stress: number
    tasks: number
  }> = []

  Object.keys(moodByDay).forEach((day) => {
    if (tasksByDay[day]) {
      correlationData.push({
        mood: moodByDay[day].mood,
        energy: moodByDay[day].energy,
        stress: moodByDay[day].stress,
        tasks: tasksByDay[day],
      })
    }
  })

  // Calculate correlation coefficients (simplified)
  const correlations = {
    moodVsProductivity: calculateCorrelation(
      correlationData.map((d) => d.mood),
      correlationData.map((d) => d.tasks)
    ),
    energyVsProductivity: calculateCorrelation(
      correlationData.map((d) => d.energy),
      correlationData.map((d) => d.tasks)
    ),
    stressVsProductivity: calculateCorrelation(
      correlationData.map((d) => d.stress),
      correlationData.map((d) => d.tasks)
    ),
  }

  // Generate insights based on correlations
  if (correlations.energyVsProductivity > 0.5) {
    insights.push('Higher energy levels strongly predict better productivity')
  }

  if (correlations.moodVsProductivity > 0.4) {
    insights.push('Better mood is linked to completing more tasks')
  }

  if (correlations.stressVsProductivity < -0.4) {
    insights.push('High stress days tend to reduce your productivity')
  }

  if (Math.abs(correlations.stressVsProductivity) > 0.5) {
    insights.push('Managing stress could significantly improve your output')
  }

  if (insights.length === 0) {
    insights.push('Keep logging to identify patterns between mood and productivity')
  }

  return { correlations, insights }
}

// Helper function to calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n === 0 || n !== y.length) return 0

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0

  return numerator / denominator
}

// Helper function to format hour
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

export const insightsService = {
  getProductivityByHour,
  getCompletionByDay,
  getHabitSuccessRates,
  getCorrelationInsights,
}
