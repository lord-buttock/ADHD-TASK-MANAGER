import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useHabits } from '../../hooks/useHabits'
import { useAuth } from '../../contexts/AuthContext'
import { HabitCard } from './HabitCard'
import { HabitForm } from './HabitForm'
import { Button } from '../ui/Button'
import type { Database } from '../../types/supabase'

type Habit = Database['public']['Tables']['habits']['Row']

type FilterType = 'all' | 'completed' | 'not-completed'

export function HabitList() {
  const { user } = useAuth()
  const { data: habits = [], isLoading } = useHabits(user?.id || '')

  const [showForm, setShowForm] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>()
  const [filter, setFilter] = useState<FilterType>('all')

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingHabit(undefined)
  }

  // Filter habits (placeholder - would need completion status)
  const filteredHabits = habits

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Habits</h2>
          <p className="text-gray-600">Build consistency, one day at a time</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Habit
        </Button>
      </div>

      {/* Filter Tabs */}
      {habits.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'all'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({habits.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'completed'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed Today
          </button>
          <button
            onClick={() => setFilter('not-completed')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === 'not-completed'
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Not Completed
          </button>
        </div>
      )}

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💪</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Start building better habits today!
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first habit and start building consistency.
          </p>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
            <Plus className="w-5 h-5" />
            Add Your First Habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* Habit Form Modal */}
      {showForm && <HabitForm habit={editingHabit} onClose={handleCloseForm} />}
    </div>
  )
}
