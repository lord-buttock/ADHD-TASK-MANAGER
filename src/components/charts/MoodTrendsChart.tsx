import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useMoodLogs, useMoodAverages, useMoodTrends } from '../../hooks/useMoodLogs'
import { useAuth } from '../../contexts/AuthContext'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MoodTrendsChartProps {
  days?: number
}

export function MoodTrendsChart({ days = 30 }: MoodTrendsChartProps) {
  const { user } = useAuth()
  const { data: logs = [], isLoading } = useMoodLogs(user?.id || '', days)
  const { data: averages } = useMoodAverages(user?.id || '', days)
  const { data: trends } = useMoodTrends(user?.id || '', days)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mood Trends</h3>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-gray-500 mb-2">No mood data yet</p>
          <p className="text-sm text-gray-400">Start logging your mood to see trends over time</p>
        </div>
      </div>
    )
  }

  // Transform logs for chart (group by day and take average if multiple logs per day)
  const chartData = logs.reduce((acc: any[], log) => {
    const date = format(new Date(log.logged_at), 'MMM dd')
    const existing = acc.find((item) => item.date === date)

    if (existing) {
      // Average if multiple logs on same day
      existing.mood = (existing.mood + log.mood) / 2
      existing.energy = (existing.energy + log.energy) / 2
      existing.stress = (existing.stress + log.stress) / 2
      existing.count++
    } else {
      acc.push({
        date,
        mood: log.mood,
        energy: log.energy,
        stress: log.stress,
        count: 1,
      })
    }

    return acc
  }, [])

  // Get trend indicator
  const getTrendIndicator = (change: number) => {
    if (change > 0.3) return { icon: TrendingUp, color: 'text-green-600', label: 'Improving' }
    if (change < -0.3) return { icon: TrendingDown, color: 'text-red-600', label: 'Declining' }
    return { icon: Minus, color: 'text-gray-600', label: 'Stable' }
  }

  const moodTrend = trends ? getTrendIndicator(trends.changes.mood) : null
  const energyTrend = trends ? getTrendIndicator(trends.changes.energy) : null
  const stressTrend = trends ? getTrendIndicator(trends.changes.stress * -1) : null // Invert for stress (lower is better)

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Mood Trends</h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => value.toFixed(1)}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Mood"
          />
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Energy"
          />
          <Line
            type="monotone"
            dataKey="stress"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Stress"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Averages and Trends */}
      {averages && averages.count > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* Mood */}
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Avg Mood</p>
            <p className="text-2xl font-bold text-blue-600">{averages.mood.toFixed(1)}</p>
            {moodTrend && (
              <div className={`flex items-center justify-center gap-1 mt-1 ${moodTrend.color}`}>
                <moodTrend.icon className="w-3 h-3" />
                <span className="text-xs">{moodTrend.label}</span>
              </div>
            )}
          </div>

          {/* Energy */}
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Avg Energy</p>
            <p className="text-2xl font-bold text-green-600">{averages.energy.toFixed(1)}</p>
            {energyTrend && (
              <div className={`flex items-center justify-center gap-1 mt-1 ${energyTrend.color}`}>
                <energyTrend.icon className="w-3 h-3" />
                <span className="text-xs">{energyTrend.label}</span>
              </div>
            )}
          </div>

          {/* Stress */}
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Avg Stress</p>
            <p className="text-2xl font-bold text-red-600">{averages.stress.toFixed(1)}</p>
            {stressTrend && (
              <div className={`flex items-center justify-center gap-1 mt-1 ${stressTrend.color}`}>
                <stressTrend.icon className="w-3 h-3" />
                <span className="text-xs">{stressTrend.label}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period info */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Based on {logs.length} {logs.length === 1 ? 'log' : 'logs'} over the last {days} days
      </p>
    </div>
  )
}
