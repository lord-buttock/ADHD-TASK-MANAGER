import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useProductivityByHour } from '../../hooks/useInsights'
import { Clock } from 'lucide-react'

interface ProductivityByHourChartProps {
  days?: number
}

export function ProductivityByHourChart({ days = 30 }: ProductivityByHourChartProps) {
  const { user } = useAuth()
  const { data, isLoading } = useProductivityByHour(user?.id || '', days)

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

  if (!data || data.hourlyData.every((h) => h.total === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity by Hour</h3>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Clock className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-gray-500 mb-2">No completed tasks yet</p>
          <p className="text-sm text-gray-400">Complete tasks throughout the day to see your peak hours</p>
        </div>
      </div>
    )
  }

  // Filter to only hours with activity (plus one hour before and after)
  const activeHours = data.hourlyData.filter((h) => h.total > 0)
  const minHour = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours.map((h) => h.hour)) - 1) : 0
  const maxHour = activeHours.length > 0 ? Math.min(23, Math.max(...activeHours.map((h) => h.hour)) + 1) : 23

  const chartData = data.hourlyData.slice(minHour, maxHour + 1).map((d) => ({
    hour: formatHour(d.hour),
    'Urgent & Important': d.urgentImportant,
    Important: d.important,
    Other: d.other,
  }))

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Productivity by Hour</h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hour"
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
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="rect"
          />
          <Bar dataKey="Urgent & Important" stackId="a" fill="#ef4444" />
          <Bar dataKey="Important" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Other" stackId="a" fill="#6b7280" />
        </BarChart>
      </ResponsiveContainer>

      {/* Peak Hours */}
      {data.peakHours.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">Peak Productivity Hours:</p>
          <div className="flex flex-wrap gap-2">
            {data.peakHours.map((hour) => (
              <span
                key={hour}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {formatHour(hour)}
              </span>
            ))}
          </div>
        </div>
      )}

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

      {/* Period info */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Based on completed tasks over the last {days} days
      </p>
    </div>
  )
}
