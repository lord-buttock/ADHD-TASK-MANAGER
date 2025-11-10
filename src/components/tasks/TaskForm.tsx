import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useCreateTask } from '../../hooks/useTasks'
import { Button } from '../ui/Button'
import { TASK_AREA } from '../../lib/constants'
import type { TaskArea } from '../../lib/constants'

interface TaskFormProps {
  onClose: () => void
}

export function TaskForm({ onClose }: TaskFormProps) {
  const { user } = useAuth()
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [important, setImportant] = useState(false)
  const [area, setArea] = useState<TaskArea>(TASK_AREA.PERSONAL)
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      await createTask.mutateAsync({
        user_id: user.id,
        title,
        notes: notes || undefined,
        urgent,
        important,
        area,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
        due_date: dueDate || undefined,
      })

      // Reset form
      setTitle('')
      setNotes('')
      setUrgent(false)
      setImportant(false)
      setArea(TASK_AREA.PERSONAL)
      setEstimatedMinutes('')
      setDueDate('')

      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What needs to be done?"
            />
          </div>

          {/* Urgency and Importance */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-gray-50"
              style={{ borderColor: urgent ? '#EF4444' : '#D1D5DB' }}>
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Urgent</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 border-2 rounded-lg transition-colors hover:bg-gray-50"
              style={{ borderColor: important ? '#3B82F6' : '#D1D5DB' }}>
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-medium">Important</span>
            </label>
          </div>

          {/* Area */}
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value as TaskArea)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={TASK_AREA.WORK}>Work</option>
              <option value={TASK_AREA.PERSONAL}>Personal</option>
              <option value={TASK_AREA.HEALTH}>Health</option>
              <option value={TASK_AREA.SOCIAL}>Social</option>
            </select>
          </div>

          {/* Estimated time and due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Time (minutes)
              </label>
              <input
                id="estimatedMinutes"
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details..."
            />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              isLoading={createTask.isPending}
            >
              Create Task
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
