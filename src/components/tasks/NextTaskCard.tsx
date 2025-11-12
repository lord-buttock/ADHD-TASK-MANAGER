import { useState } from 'react'
import { ArrowRight, Sparkles, Check, Trash2, Clock, RefreshCw } from 'lucide-react'
import type { Task } from '../../types/task.types'
import { getNextTask, getEisenhowerQuadrant, getQuadrantLabel } from '../../utils/priorityCalculator'
import { useUpdateTaskStatus, useDeleteTask, useUpdateTask } from '../../hooks/useTasks'
import { Button } from '../ui/Button'
import { TASK_STATUS } from '../../lib/constants'

interface NextTaskCardProps {
  tasks: Task[]
}

export function NextTaskCard({ tasks }: NextTaskCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const updateTask = useUpdateTask()
  const nextTask = getNextTask(tasks)

  if (!nextTask) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 text-center">
        <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
          <Sparkles className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">
          All done! 🎉
        </h3>
        <p className="text-green-700">
          You've completed all your tasks. Time to relax or add new ones!
        </p>
      </div>
    )
  }

  const quadrant = getEisenhowerQuadrant(nextTask)
  const quadrantLabel = getQuadrantLabel(quadrant)

  const handleStartTask = () => {
    if (nextTask.status === TASK_STATUS.TODO) {
      updateStatus.mutate({ id: nextTask.id, status: TASK_STATUS.IN_PROGRESS })
    }
  }

  const handleCompleteTask = () => {
    updateStatus.mutate({ id: nextTask.id, status: TASK_STATUS.DONE })
  }

  const handleDeleteTask = () => {
    if (confirm(`Delete "${nextTask.title}"?`)) {
      deleteTask.mutate(nextTask.id)
    }
  }

  const handleSkipTask = () => {
    // Remove urgent flag to de-prioritize this task
    updateTask.mutate({
      id: nextTask.id,
      updates: { urgent: false },
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Trigger a visual refresh animation
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 transition-all ${
      isRefreshing ? 'scale-[0.98] opacity-80' : 'scale-100 opacity-100'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-blue-900">Recommended Next Task</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
            title="Refresh recommendation"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-xs px-2 py-1 bg-blue-100 border border-blue-300 rounded-full text-blue-800 font-medium">
            {quadrantLabel}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">
          {nextTask.title}
        </h4>

        {nextTask.notes && (
          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
            {nextTask.notes}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-sm">
          {nextTask.urgent && (
            <span className="px-2 py-1 bg-red-100 border border-red-300 rounded text-red-800">
              Urgent
            </span>
          )}
          {nextTask.important && (
            <span className="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-blue-800">
              Important
            </span>
          )}
          {nextTask.area && (
            <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-800 capitalize">
              {nextTask.area}
            </span>
          )}
          {nextTask.estimated_minutes && (
            <span className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-800">
              ~{nextTask.estimated_minutes} min
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {nextTask.status === TASK_STATUS.TODO && (
          <Button
            onClick={handleStartTask}
            className="w-full flex items-center justify-center gap-2"
            isLoading={updateStatus.isPending}
          >
            Start This Task
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {nextTask.status === TASK_STATUS.IN_PROGRESS && (
          <div className="flex items-center justify-center gap-2 text-yellow-700 font-medium py-2">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            Already in progress
          </div>
        )}

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleCompleteTask}
            variant="secondary"
            size="sm"
            className="flex items-center justify-center gap-1"
            isLoading={updateStatus.isPending}
          >
            <Check className="w-4 h-4" />
            Done
          </Button>
          <Button
            onClick={handleSkipTask}
            variant="ghost"
            size="sm"
            className="flex items-center justify-center gap-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
            isLoading={updateTask.isPending}
          >
            <Clock className="w-4 h-4" />
            Skip
          </Button>
          <Button
            onClick={handleDeleteTask}
            variant="ghost"
            size="sm"
            className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            isLoading={deleteTask.isPending}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
