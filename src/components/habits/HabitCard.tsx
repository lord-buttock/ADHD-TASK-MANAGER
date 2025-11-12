import { useState, useRef } from 'react'
import { Edit2, Trash2, Check, Star, Calendar, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useCompleteHabit, useDeleteHabit, useIsCompletedToday } from '../../hooks/useHabits'
import { habitAI } from '../../services/habitAI'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import {
  celebrateCompletion,
  celebrateMilestone,
  celebrateNewRecord,
  getCelebrationType,
  getMilestoneMessage,
} from '../../utils/celebrations'
import type { Database } from '../../types/supabase'

type Habit = Database['public']['Tables']['habits']['Row']

interface HabitCardProps {
  habit: Habit
  onEdit: (habit: Habit) => void
}

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const { user } = useAuth()
  const completeHabit = useCompleteHabit()
  const deleteHabit = useDeleteHabit()
  const { data: isCompleted = false } = useIsCompletedToday(habit.id, user?.id || '')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [encouragementMessage, setEncouragementMessage] = useState('')
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleComplete = async () => {
    if (!user || isCompleted) return

    try {
      const result = await completeHabit.mutateAsync({
        habitId: habit.id,
        userId: user.id,
      })

      if (result.success) {
        // Get button position for confetti
        const rect = buttonRef.current?.getBoundingClientRect()

        // Determine celebration type
        const celebrationType = getCelebrationType(result.newStreak, result.isNewRecord)

        // Trigger appropriate celebration
        if (celebrationType === 'record') {
          celebrateNewRecord(rect)
        } else if (celebrationType === 'milestone') {
          celebrateMilestone(result.newStreak, rect)
        } else {
          celebrateCompletion(rect)
        }

        // Get milestone message or AI encouragement
        const milestoneMsg = getMilestoneMessage(result.newStreak)
        if (milestoneMsg) {
          setEncouragementMessage(milestoneMsg)
          setShowEncouragement(true)
          setTimeout(() => setShowEncouragement(false), 5000)
        } else {
          // Get AI encouragement
          const context = result.isNewRecord ? 'milestone' : 'completed'
          habitAI
            .generateEncouragement(habit.name, result.newStreak, context)
            .then((msg) => {
              setEncouragementMessage(msg)
              setShowEncouragement(true)
              setTimeout(() => setShowEncouragement(false), 5000)
            })
            .catch(console.error)
        }
      }
    } catch (err) {
      console.error('Failed to complete habit:', err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteHabit.mutateAsync(habit.id)
      setShowDeleteConfirm(false)
    } catch (err) {
      console.error('Failed to delete habit:', err)
    }
  }

  // Get flame styling based on streak
  const getFlameStyle = (streak: number) => {
    if (streak === 0) {
      return { opacity: 0.3, scale: 0.8, filter: 'grayscale(100%)' }
    } else if (streak <= 2) {
      return { opacity: 0.6, scale: 1 }
    } else if (streak <= 6) {
      return { opacity: 1, scale: 1.1 }
    } else if (streak <= 13) {
      return { opacity: 1, scale: 1.2 }
    } else if (streak <= 29) {
      return { opacity: 1, scale: 1.3, filter: 'hue-rotate(-20deg) saturate(1.5)' }
    } else {
      // Rainbow flame for 30+ days
      return {
        opacity: 1,
        scale: 1.5,
        animation: 'rainbow 3s linear infinite',
      }
    }
  }

  const flameStyle = getFlameStyle(habit.current_streak)

  // Calculate last completed (placeholder - would need completion history)
  const lastCompleted = isCompleted ? 'Today' : null

  return (
    <>
      <div
        className="rounded-lg border-2 p-6 transition-all hover:shadow-lg relative overflow-hidden"
        style={{
          backgroundColor: habit.color + '20',
          borderColor: habit.color,
        }}
      >
        {/* Edit and Delete buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={() => onEdit(habit)}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded hover:bg-white/50 transition-colors"
            title="Edit habit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-gray-500 hover:text-red-600 p-1.5 rounded hover:bg-white/50 transition-colors"
            title="Delete habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Icon and Name */}
        <div className="flex items-start gap-3 mb-4 pr-20">
          <span className="text-4xl" style={{ filter: isCompleted ? 'grayscale(50%)' : 'none' }}>
            {habit.icon}
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{habit.name}</h3>
            {lastCompleted && (
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Last: {lastCompleted}
              </p>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {habit.notes && (
          <div className="mb-4">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium mb-2"
            >
              {showNotes ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {showNotes ? 'Hide' : 'Show'} AI Insights
            </button>
            {showNotes && (
              <div className="text-xs bg-white/70 rounded-lg p-3 whitespace-pre-wrap text-gray-700 border border-gray-200">
                {habit.notes}
              </div>
            )}
          </div>
        )}

        {/* Streak Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Current Streak */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-2xl transition-transform"
                style={{
                  transform: `scale(${flameStyle.scale})`,
                  opacity: flameStyle.opacity,
                  filter: flameStyle.filter,
                }}
              >
                🔥
              </span>
              <span className="text-2xl font-bold text-gray-900">{habit.current_streak}</span>
            </div>
            <p className="text-xs text-gray-600">
              {habit.current_streak === 1 ? 'day' : 'days'} streak
            </p>
          </div>

          {/* Record Streak */}
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{habit.record_streak}</span>
            </div>
            <p className="text-xs text-gray-600">record</p>
          </div>
        </div>

        {/* Completion Button */}
        <button
          ref={buttonRef}
          onClick={handleComplete}
          disabled={isCompleted || completeHabit.isPending}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            isCompleted
              ? 'bg-green-500 text-white cursor-not-allowed'
              : `text-white hover:opacity-90 active:scale-95 ${
                  completeHabit.isPending ? 'opacity-50 cursor-wait' : ''
                }`
          }`}
          style={{
            backgroundColor: isCompleted ? '#10b981' : habit.color,
          }}
        >
          {isCompleted ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Completed Today!
            </span>
          ) : completeHabit.isPending ? (
            'Completing...'
          ) : (
            'Mark Complete'
          )}
        </button>

        {/* Encouragement Message */}
        {showEncouragement && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fade-in">
            <p className="text-sm text-blue-900">{encouragementMessage}</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete habit?</h3>
            <p className="text-gray-700 mb-6">
              This will remove "{habit.name}" and all completion history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDelete}
                variant="danger"
                className="flex-1"
                isLoading={deleteHabit.isPending}
              >
                Delete
              </Button>
              <Button onClick={() => setShowDeleteConfirm(false)} variant="ghost" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for rainbow animation */}
      <style>{`
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg) saturate(1.5); }
          100% { filter: hue-rotate(360deg) saturate(1.5); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
