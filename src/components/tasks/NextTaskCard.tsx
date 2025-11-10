import { ArrowRight, Sparkles } from 'lucide-react'
import type { Task } from '../../types/task.types'
import { getNextTask, getEisenhowerQuadrant, getQuadrantLabel } from '../../utils/priorityCalculator'
import { useUpdateTaskStatus } from '../../hooks/useTasks'
import { Button } from '../ui/Button'
import { TASK_STATUS } from '../../lib/constants'

interface NextTaskCardProps {
  tasks: Task[]
}

export function NextTaskCard({ tasks }: NextTaskCardProps) {
  const updateStatus = useUpdateTaskStatus()
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

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-blue-900">Recommended Next Task</h3>
        </div>
        <span className="text-xs px-2 py-1 bg-blue-100 border border-blue-300 rounded-full text-blue-800 font-medium">
          {quadrantLabel}
        </span>
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
        <div className="flex items-center justify-center gap-2 text-yellow-700 font-medium">
          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
          Already in progress
        </div>
      )}
    </div>
  )
}
