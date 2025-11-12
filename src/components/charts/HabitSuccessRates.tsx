import { useAuth } from '../../contexts/AuthContext'
import { useHabitSuccessRates } from '../../hooks/useInsights'
import { Target } from 'lucide-react'

interface HabitSuccessRatesProps {
  days?: number
}

export function HabitSuccessRates({ days = 30 }: HabitSuccessRatesProps) {
  const { user } = useAuth()
  const { data, isLoading } = useHabitSuccessRates(user?.id || '', days)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.habitStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Habit Success Rates</h3>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Target className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-gray-500 mb-2">No active habits</p>
          <p className="text-sm text-gray-400">Create habits to track your consistency</p>
        </div>
      </div>
    )
  }

  // Get color based on success rate
  const getRateColor = (rate: number) => {
    if (rate >= 90) return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' }
    if (rate >= 70) return { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' }
    if (rate >= 50) return { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' }
    return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' }
  }

  const overallColor = getRateColor(data.overallRate)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Habit Success Rates</h3>

      {/* Overall Rate */}
      <div className={`mb-6 p-4 border-2 ${overallColor.border} rounded-lg`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-900">Overall Completion Rate</p>
          <p className={`text-2xl font-bold ${overallColor.text}`}>{data.overallRate}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`${overallColor.bg} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${data.overallRate}%` }}
          ></div>
        </div>
      </div>

      {/* Individual Habits */}
      <div className="space-y-4 mb-6">
        {data.habitStats.map((habit) => {
          const color = getRateColor(habit.successRate)
          return (
            <div key={habit.id} className="p-4 bg-gray-50 rounded-lg">
              {/* Habit Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{habit.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{habit.name}</p>
                    <p className="text-xs text-gray-500">
                      {habit.completions}/{habit.possibleDays} days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${color.text}`}>{habit.successRate}%</p>
                  {habit.currentStreak > 0 && (
                    <p className="text-xs text-orange-600">🔥 {habit.currentStreak} day streak</p>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${color.bg} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${habit.successRate}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-2">
          {data.insights.map((insight, i) => (
            <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>{insight}</span>
            </p>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">90-100%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">70-89%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">50-69%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">&lt;50%</span>
        </div>
      </div>

      {/* Period info */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Based on habit completions over the last {days} days
      </p>
    </div>
  )
}
