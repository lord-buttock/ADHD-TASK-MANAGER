import { useState } from 'react'
import { X, Check, Edit2, Clock, Calendar, Flag, Star } from 'lucide-react'
import type { ParsedTask } from '../../types/task.types'
import { Button } from '../ui/Button'

interface AITaskReviewProps {
  tasks: ParsedTask[]
  onAcceptAll: () => void
  onAccept: (tasks: ParsedTask[]) => void
  onCancel: () => void
}

export function AITaskReview({ tasks, onAcceptAll, onAccept, onCancel }: AITaskReviewProps) {
  const [editedTasks, setEditedTasks] = useState<ParsedTask[]>(tasks)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(
    new Set(tasks.map((_, i) => i))
  )

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const updateTask = (index: number, updates: Partial<ParsedTask>) => {
    const updated = [...editedTasks]
    updated[index] = { ...updated[index], ...updates }
    setEditedTasks(updated)
  }

  const handleAccept = () => {
    const tasksToCreate = editedTasks.filter((_, i) => selectedTasks.has(i))
    onAccept(tasksToCreate)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">✨ AI Created {editedTasks.length} {editedTasks.length === 1 ? 'Task' : 'Tasks'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit before saving
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {editedTasks.map((task, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-5 transition-all ${
                selectedTasks.has(index)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTasks.has(index)}
                  onChange={() => toggleTask(index)}
                  className="mt-1 w-5 h-5 rounded border-gray-300"
                />

                <div className="flex-1">
                  {/* Title */}
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(index, { title: e.target.value })}
                    className="w-full text-lg font-semibold px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3 mb-3">
                    <button
                      onClick={() => updateTask(index, { urgent: !task.urgent })}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                        task.urgent
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Flag className="w-3 h-3" />
                      Urgent
                    </button>

                    <button
                      onClick={() => updateTask(index, { important: !task.important })}
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                        task.important
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Star className="w-3 h-3" />
                      Important
                    </button>

                    <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800 capitalize">
                      {task.area}
                    </span>

                    {task.estimated_minutes && (
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimated_minutes} min
                      </span>
                    )}

                    {task.due_date && (
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-800 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {task.notes && (
                    <textarea
                      value={task.notes}
                      onChange={(e) => updateTask(index, { notes: e.target.value })}
                      className="w-full text-sm px-2 py-1 rounded border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
                      rows={2}
                    />
                  )}

                  {/* AI Reasoning */}
                  {task.reasoning && (
                    <p className="text-xs text-gray-500 italic mt-2">
                      💡 AI reasoning: {task.reasoning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-6 border-t sticky bottom-0 bg-white">
          <Button
            onClick={handleAccept}
            disabled={selectedTasks.size === 0}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Accept {selectedTasks.size === editedTasks.length ? 'All' : `${selectedTasks.size} Selected`}
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
