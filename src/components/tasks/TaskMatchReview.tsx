import { useState } from 'react'
import { X, FileText, Plus } from 'lucide-react'
import type { TaskMatch } from '../../types/task.types'
import { Button } from '../ui/Button'
import { getEisenhowerQuadrant, getQuadrantLabel } from '../../utils/priorityCalculator'

interface TaskMatchReviewProps {
  noteContent: string
  matches: TaskMatch[]
  onMerge: (taskId: string) => Promise<void>
  onCreateNew: () => void
  onCancel: () => void
}

export function TaskMatchReview({
  noteContent,
  matches,
  onMerge,
  onCreateNew,
  onCancel,
}: TaskMatchReviewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [merging, setMerging] = useState(false)

  const handleMerge = async () => {
    if (!selectedTaskId) return

    setMerging(true)
    try {
      await onMerge(selectedTaskId)
    } catch (error) {
      console.error('Failed to merge:', error)
      setMerging(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔍 Found Related Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI found {matches.length} existing {matches.length === 1 ? 'task' : 'tasks'} that might be related
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Your note */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Your Note:</h3>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{noteContent}</p>
          </div>

          {/* Matched tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Select a task to merge with:</h3>
            {matches.map((match) => {
              const quadrant = getEisenhowerQuadrant(match.task)
              const label = getQuadrantLabel(quadrant)
              const isSelected = selectedTaskId === match.task.id

              return (
                <button
                  key={match.task.id}
                  onClick={() => setSelectedTaskId(match.task.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{match.task.title}</h4>
                      {match.task.notes && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {match.task.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4">
                      <span className="text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded-full">
                        {label}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 border border-green-300 rounded-full text-green-800 font-medium">
                        {match.similarity}% match
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    💡 {match.reasoning}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleMerge}
              disabled={!selectedTaskId || merging}
              isLoading={merging}
              className="w-full flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Add Notes to Selected Task
            </Button>

            <Button
              onClick={onCreateNew}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              No, Create New Task Instead
            </Button>

            <Button
              onClick={onCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
