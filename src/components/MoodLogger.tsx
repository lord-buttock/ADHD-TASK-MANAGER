import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useLogMood, useLatestMoodLog, useMoodStreak } from '../hooks/useMoodLogs'
import { Button } from './ui/Button'

interface MoodLoggerProps {
  isCollapsible?: boolean
  defaultExpanded?: boolean
}

export function MoodLogger({ isCollapsible = false, defaultExpanded = true }: MoodLoggerProps) {
  const { user } = useAuth()
  const logMood = useLogMood()
  const { data: latestLog } = useLatestMoodLog(user?.id || '')
  const { data: streak = 0 } = useMoodStreak(user?.id || '')

  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [notes, setNotes] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Get emoji for mood (1-5)
  const getMoodEmoji = (value: number) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😄']
    return emojis[value - 1] || '😐'
  }

  // Get emoji for energy (1-5)
  const getEnergyEmoji = (value: number) => {
    if (value <= 2) return '🪫'
    if (value === 3) return '🔋'
    return '⚡'
  }

  // Get stress color gradient (green to red)
  const getStressColor = (value: number) => {
    const colors = [
      '#10b981', // green-500
      '#84cc16', // lime-500
      '#eab308', // yellow-500
      '#f97316', // orange-500
      '#ef4444', // red-500
    ]
    return colors[value - 1] || colors[2]
  }

  // Get stress emoji (1-5)
  const getStressEmoji = (value: number) => {
    if (value <= 2) return '😌'
    if (value === 3) return '😐'
    if (value === 4) return '😰'
    return '😱'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      await logMood.mutateAsync({
        userId: user.id,
        mood,
        energy,
        stress,
        notes: notes.trim() || undefined,
      })

      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Reset notes
      setNotes('')
    } catch (err) {
      console.error('Failed to log mood:', err)
    }
  }

  const lastLoggedText = latestLog
    ? formatDistanceToNow(new Date(latestLog.logged_at), { addSuffix: true })
    : 'Never'

  if (isCollapsible && !isExpanded) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Your Current State</h2>
            <p className="text-sm text-gray-600">Last logged: {lastLoggedText}</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Log Your Current State</h2>
          <p className="text-sm text-gray-600">Track your mood, energy, and stress levels</p>
        </div>
        {isCollapsible && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronUp className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
          <p className="text-sm text-green-900 font-medium">
            ✓ Logged successfully! Keep up the tracking streak!
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Mood</label>
            <span className="text-4xl" role="img" aria-label="mood">
              {getMoodEmoji(mood)}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Very Bad</span>
            <span>Great</span>
          </div>
        </div>

        {/* Energy Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Energy</label>
            <span className="text-4xl" role="img" aria-label="energy">
              {getEnergyEmoji(energy)}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Exhausted</span>
            <span>Energized</span>
          </div>
        </div>

        {/* Stress Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Stress</label>
            <span className="text-4xl" role="img" aria-label="stress">
              {getStressEmoji(stress)}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-stress"
            style={{
              background: `linear-gradient(to right, #10b981 0%, ${getStressColor(stress)} ${
                ((stress - 1) / 4) * 100
              }%, #ef4444 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Calm</span>
            <span>Very Stressed</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="mood-notes" className="text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <span className="text-xs text-gray-500">{notes.length}/500</span>
          </div>
          <textarea
            id="mood-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="How are you feeling? What's on your mind?"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" isLoading={logMood.isPending} size="lg">
          Log Current State
        </Button>

        {/* Last Logged & Streak */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Last logged: {lastLoggedText}</p>
          {streak > 0 && (
            <p className="text-sm font-medium text-orange-600">
              🔥 Logged {streak} {streak === 1 ? 'day' : 'days'} in a row
            </p>
          )}
        </div>
      </form>

      {/* Custom slider styles */}
      <style>{`
        /* Base slider styling */
        input[type='range'] {
          -webkit-appearance: none;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Blue slider for mood */
        .slider-blue::-webkit-slider-thumb {
          border-color: #3b82f6;
        }

        .slider-blue::-moz-range-thumb {
          border-color: #3b82f6;
        }

        /* Green slider for energy */
        .slider-green::-webkit-slider-thumb {
          border-color: #10b981;
        }

        .slider-green::-moz-range-thumb {
          border-color: #10b981;
        }

        /* Stress slider (gradient handled inline) */
        .slider-stress::-webkit-slider-thumb {
          border-color: #ef4444;
        }

        .slider-stress::-moz-range-thumb {
          border-color: #ef4444;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
