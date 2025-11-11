import { useState } from 'react'
import { X, Check, Flag, Star, Clock, Calendar, FileText, Plus, ArrowRight } from 'lucide-react'
import type { ParsedTaskWithMatches } from '../../types/task.types'
import { Button } from '../ui/Button'
import { getEisenhowerQuadrant, getQuadrantLabel } from '../../utils/priorityCalculator'

interface AITaskReviewProps {
  tasksWithMatches: ParsedTaskWithMatches[]
  onAccept: (tasks: ParsedTaskWithMatches[]) => void
  onCancel: () => void
}

export function AITaskReview({ tasksWithMatches, onAccept, onCancel }: AITaskReviewProps) {
  const [editedTasks, setEditedTasks] = useState<ParsedTaskWithMatches[]>(tasksWithMatches)

  const updateTaskAction = (index: number, action: 'create' | 'merge', mergeIntoTaskId?: string) => {
    const updated = [...editedTasks]
    updated[index] = {
      ...updated[index],
      action,
      mergeIntoTaskId,
    }
    setEditedTasks(updated)
  }

  const handleAccept = () => {
    onAccept(editedTasks)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              ✨ AI Found {editedTasks.length} {editedTasks.length === 1 ? 'Task' : 'Tasks'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review each task and decide whether to create new or merge with existing
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
          {editedTasks.map((item, index) => {
            const { parsedTask, matches, action } = item
            const hasMatches = matches.length > 0

            return (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-5 bg-white"
              >
                {/* Parsed Task */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {parsedTask.title}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {parsedTask.urgent && (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                    {parsedTask.important && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Important
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 capitalize">
                      {parsedTask.area}
                    </span>
                    {parsedTask.estimated_minutes && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {parsedTask.estimated_minutes} min
                      </span>
                    )}
                    {parsedTask.due_date && (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(parsedTask.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {parsedTask.notes && (
                    <p className="text-sm text-gray-600 mt-2">{parsedTask.notes}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {hasMatches ? (
                    <>
                      <p className="text-sm font-medium text-gray-700">
                        🔍 Found {matches.length} similar {matches.length === 1 ? 'task' : 'tasks'}:
                      </p>

                      {/* Show matches */}
                      {matches.map((match) => {
                        const quadrant = getEisenhowerQuadrant(match.task)
                        const label = getQuadrantLabel(quadrant)
                        const isSelected = action === 'merge' && item.mergeIntoTaskId === match.task.id

                        return (
                          <button
                            key={match.task.id}
                            onClick={() => updateTaskAction(index, 'merge', match.task.id)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{match.task.title}</h4>
                                {match.task.notes && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">
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
                            <p className="text-xs text-gray-600 italic">
                              💡 {match.reasoning}
                            </p>
                            {isSelected && (
                              <div className="mt-2 flex items-center gap-2 text-green-700 text-sm font-medium">
                                <ArrowRight className="w-4 h-4" />
                                Will merge into this task
                              </div>
                            )}
                          </button>
                        )
                      })}

                      {/* Create new option */}
                      <button
                        onClick={() => updateTaskAction(index, 'create')}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          action === 'create'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">
                            No, create as new task instead
                          </span>
                        </div>
                        {action === 'create' && (
                          <div className="mt-2 flex items-center gap-2 text-blue-700 text-sm font-medium">
                            <ArrowRight className="w-4 h-4" />
                            Will create new task
                          </div>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">No similar tasks found - will create as new</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <Button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept All Decisions
          </Button>
          <Button
            onClick={onCancel}
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
