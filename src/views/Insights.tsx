import { useState, useEffect } from 'react'
import { MoodLogger } from '../components/MoodLogger'
import { MoodTrendsChart } from '../components/charts/MoodTrendsChart'
import { ProductivityByHourChart } from '../components/charts/ProductivityByHourChart'
import { CompletionByDayChart } from '../components/charts/CompletionByDayChart'
import { HabitSuccessRates } from '../components/charts/HabitSuccessRates'
import { useCorrelationInsights } from '../hooks/useInsights'
import { useAuth } from '../contexts/AuthContext'

type TimePeriod = 7 | 30 | 90

export function Insights() {
  const { user } = useAuth()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('insights-time-period')
    return saved ? (Number(saved) as TimePeriod) : 30
  })

  const { data: correlations } = useCorrelationInsights(user?.id || '', timePeriod)

  // Save time period to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('insights-time-period', String(timePeriod))
  }, [timePeriod])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600 mt-1">Track your mood and discover productivity patterns</p>
      </div>

      {/* Mood Logger */}
      <MoodLogger isCollapsible={true} defaultExpanded={false} />

      {/* Time Period Selector */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-bold text-gray-900">Your Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTimePeriod(7)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timePeriod === 7
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimePeriod(30)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timePeriod === 30
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimePeriod(90)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timePeriod === 90
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Correlation Insights Banner */}
      {correlations && correlations.insights.length > 0 && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Pattern Insights</h3>
          <div className="space-y-2">
            {correlations.insights.map((insight, i) => (
              <p key={i} className="text-purple-800 flex items-start gap-2">
                <span className="text-purple-500">✨</span>
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Trends - Full Width on Mobile, Half on Desktop */}
        <div className="lg:col-span-2">
          <MoodTrendsChart days={timePeriod} />
        </div>

        {/* Productivity by Hour */}
        <ProductivityByHourChart days={timePeriod} />

        {/* Completion by Day */}
        <CompletionByDayChart days={timePeriod} />

        {/* Habit Success Rates - Full Width */}
        <div className="lg:col-span-2">
          <HabitSuccessRates days={timePeriod} />
        </div>
      </div>

      {/* ADHD Tips */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-900 mb-3">ADHD-Friendly Tips</h3>
        <ul className="space-y-2 text-green-800">
          <li className="flex items-start gap-2">
            <span>💡</span>
            <span>Log your mood consistently to identify patterns and triggers</span>
          </li>
          <li className="flex items-start gap-2">
            <span>⚡</span>
            <span>Schedule important tasks during your peak productivity hours</span>
          </li>
          <li className="flex items-start gap-2">
            <span>🎯</span>
            <span>Focus on 1-2 core habits rather than trying to track too many</span>
          </li>
          <li className="flex items-start gap-2">
            <span>🔄</span>
            <span>Review your insights weekly to adjust your strategies</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
