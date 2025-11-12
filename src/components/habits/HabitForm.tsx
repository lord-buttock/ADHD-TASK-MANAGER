import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useCreateHabit, useUpdateHabit } from '../../hooks/useHabits'
import { habitAI, type HabitSuggestion } from '../../services/habitAI'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/supabase'

type Habit = Database['public']['Tables']['habits']['Row']

interface HabitFormProps {
  habit?: Habit
  onClose: () => void
  onSuccess?: () => void
}

const PRESET_ICONS = ['💪', '🏃', '📚', '🧘', '🥗', '💧', '😴', '🎯', '✍️', '🧹', '🎨', '🎵']
const PRESET_COLORS = [
  '#ef4444', // red
  '#f59e0b', // orange
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

export function HabitForm({ habit, onClose, onSuccess }: HabitFormProps) {
  const { user } = useAuth()
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()

  const [name, setName] = useState(habit?.name || '')
  const [notes, setNotes] = useState(habit?.notes || '')
  const [icon, setIcon] = useState(habit?.icon || '🎯')
  const [color, setColor] = useState(habit?.color || '#3b82f6')
  const [error, setError] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<HabitSuggestion | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [showAISuggestion, setShowAISuggestion] = useState(false)

  const isEditing = !!habit

  const handleGetAISuggestions = async () => {
    if (!name.trim() || !user) return

    setLoadingAI(true)
    setError('')

    try {
      const suggestion = await habitAI.getHabitSuggestions(name, user.id)
      setAiSuggestion(suggestion)
      setShowAISuggestion(true)
    } catch (err) {
      setError('Failed to get AI suggestions')
      console.error(err)
    } finally {
      setLoadingAI(false)
    }
  }

  const handleUseAISuggestion = (useEasierVersion: boolean = false) => {
    if (!aiSuggestion) return

    // Use either the improved name or the easier version
    const habitName = useEasierVersion && aiSuggestion.easierVersion
      ? aiSuggestion.easierVersion
      : aiSuggestion.improvedName

    setName(habitName)

    // Build comprehensive notes from AI suggestions
    const notesParts = []

    notesParts.push(`💡 AI Insights:`)
    notesParts.push(`${aiSuggestion.reasoning}`)
    notesParts.push(``)

    if (aiSuggestion.difficultyExplanation) {
      notesParts.push(`📊 Difficulty: ${aiSuggestion.difficulty}/10`)
      notesParts.push(`${aiSuggestion.difficultyExplanation}`)
      notesParts.push(``)
    }

    if (useEasierVersion && aiSuggestion.improvedName) {
      notesParts.push(`🎯 Original suggestion: ${aiSuggestion.improvedName}`)
      notesParts.push(``)
    } else if (!useEasierVersion && aiSuggestion.easierVersion) {
      notesParts.push(`💪 Easier alternative: ${aiSuggestion.easierVersion}`)
      notesParts.push(``)
    }

    if (aiSuggestion.bestTime) {
      notesParts.push(`⏰ Best time: ${aiSuggestion.bestTime}`)
      notesParts.push(``)
    }

    if (aiSuggestion.stackWith && aiSuggestion.stackSuggestion) {
      notesParts.push(`🔗 Habit stacking: ${aiSuggestion.stackSuggestion}`)
      notesParts.push(``)
    }

    if (aiSuggestion.barriers && aiSuggestion.barriers.length > 0) {
      notesParts.push(`⚠️ Potential barriers:`)
      aiSuggestion.barriers.forEach(barrier => {
        notesParts.push(`• ${barrier}`)
      })
      notesParts.push(``)
    }

    if (aiSuggestion.encouragement) {
      notesParts.push(`✨ ${aiSuggestion.encouragement}`)
    }

    // Set the notes with all AI insights
    const aiNotes = notesParts.join('\n')
    setNotes(aiNotes)
    setShowAISuggestion(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Habit name is required')
      return
    }

    if (name.trim().length > 100) {
      setError('Habit name must be less than 100 characters')
      return
    }

    if (!user) {
      setError('You must be logged in')
      return
    }

    try {
      if (isEditing) {
        await updateHabit.mutateAsync({
          id: habit.id,
          updates: {
            name: name.trim(),
            notes: notes.trim() || null,
            icon,
            color,
          },
        })
      } else {
        await createHabit.mutateAsync({
          user_id: user.id,
          name: name.trim(),
          notes: notes.trim() || null,
          frequency: 'daily',
          icon,
          color,
        })
      }

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save habit')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Habit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Habit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 10-minute walk after breakfast"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/100 characters</p>

            {/* AI Suggestions Button */}
            {!isEditing && name.trim().length > 3 && (
              <Button
                type="button"
                onClick={handleGetAISuggestions}
                variant="secondary"
                className="mt-3 flex items-center gap-2"
                isLoading={loadingAI}
                disabled={loadingAI}
              >
                <Sparkles className="w-4 h-4" />
                {loadingAI ? 'Analyzing your patterns...' : 'Get AI Suggestions'}
              </Button>
            )}
          </div>

          {/* AI Suggestion Display */}
          {showAISuggestion && aiSuggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Suggestion
                  </h3>
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    {aiSuggestion.improvedName}
                  </p>
                  <p className="text-xs text-blue-700">{aiSuggestion.reasoning}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAISuggestion(false)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Difficulty */}
              <div className="text-sm">
                <span className="font-medium text-blue-900">
                  Difficulty: {aiSuggestion.difficulty}/10
                </span>
                <p className="text-xs text-blue-700">{aiSuggestion.difficultyExplanation}</p>
              </div>

              {/* Easier Version */}
              {aiSuggestion.easierVersion && (
                <div className="text-sm bg-white/50 rounded p-2">
                  <span className="font-medium text-blue-900">Easier alternative:</span>
                  <p className="text-xs text-blue-700">{aiSuggestion.easierVersion}</p>
                </div>
              )}

              {/* Best Time */}
              {aiSuggestion.bestTime && (
                <div className="text-sm">
                  <span className="font-medium text-blue-900">Best time:</span>{' '}
                  <span className="text-blue-700">{aiSuggestion.bestTime}</span>
                </div>
              )}

              {/* Stacking */}
              {aiSuggestion.stackWith && aiSuggestion.stackSuggestion && (
                <div className="text-sm bg-white/50 rounded p-2">
                  <span className="font-medium text-blue-900">Habit stacking:</span>
                  <p className="text-xs text-blue-700">{aiSuggestion.stackSuggestion}</p>
                </div>
              )}

              {/* Encouragement */}
              <p className="text-sm text-blue-800 italic">{aiSuggestion.encouragement}</p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => handleUseAISuggestion(false)}
                  variant="primary"
                  size="sm"
                >
                  Use This
                </Button>
                {aiSuggestion.easierVersion && (
                  <Button
                    type="button"
                    onClick={() => handleUseAISuggestion(true)}
                    variant="secondary"
                    size="sm"
                  >
                    Use Easier Version
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setShowAISuggestion(false)}
                  variant="ghost"
                  size="sm"
                >
                  Keep Mine
                </Button>
              </div>
            </div>
          )}

          {/* Notes Field */}
          {notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes & AI Insights
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                rows={8}
                placeholder="Add notes about this habit..."
              />
              <p className="text-xs text-gray-500 mt-1">
                These insights will help you stay on track
              </p>
            </div>
          )}

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                    icon === emoji
                      ? 'border-blue-500 bg-blue-50 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    color === c ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <div
              className="rounded-lg p-4 border-2"
              style={{
                backgroundColor: color + '20',
                borderColor: color,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{icon}</span>
                <span className="font-medium text-gray-900">{name || 'Your habit name'}</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={createHabit.isPending || updateHabit.isPending}
              disabled={createHabit.isPending || updateHabit.isPending}
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
