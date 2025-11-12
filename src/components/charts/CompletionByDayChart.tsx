import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useCompletionByDay } from '../../hooks/useInsights'
import { Calendar } from 'lucide-react'

interface CompletionByDayChartProps {
  days?: number
}

export function CompletionByDayChart({ days = 30 }: CompletionByDayChartProps) {
  const { user } = useAuth()
  const { data, isLoading } = useCompletionByDay(user?.id || '', days)

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

  if (!data || data.dailyData.every((d) => d.completed === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Completion by Day of Week</h3>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-gray-500 mb-2">No completed tasks yet</p>
          <p className="text-sm text-gray-400">Complete tasks to discover your most productive days</p>
        </div>
      </div>
    )
  }

  // Get color based on average completion rate
  const getBarColor = (avgPerDay: number) => {
    const maxAvg = Math.max(...data.dailyData.map((d) => d.avgPerDay))
    const ratio = maxAvg > 0 ? avgPerDay / maxAvg : 0

    if (ratio >= 0.8) return '#10b981' // green-500 (high)
    if (ratio >= 0.5) return '#3b82f6' // blue-500 (medium)
    return '#ef4444' // red-500 (low)
  }

  const chartData = data.dailyData.map((d) => ({
    day: d.day.slice(0, 3), // Shorten to 3 letters (Mon, Tue, etc.)
    completed: d.completed,
    avgPerDay: d.avgPerDay,
  }))

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Completion by Day of Week</h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="day"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'avgPerDay') {
                return [value.toFixed(1), 'Avg per day']
              }
              return [value, 'Total completed']
            }}
          />
          <Bar dataKey="completed" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.avgPerDay)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Best/Worst Days */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Best Day</p>
          <p className="text-xl font-bold text-green-600">{data.bestDay}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Slowest Day</p>
          <p className="text-xl font-bold text-red-600">{data.worstDay}</p>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.insights.map((insight, i) => (
            <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>{insight}</span>
            </p>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600">Low</span>
        </div>
      </div>

      {/* Period info */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Based on completed tasks over the last {days} days
      </p>
    </div>
  )
}
