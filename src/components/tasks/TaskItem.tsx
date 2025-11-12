import { useState } from 'react'
import { Trash2, ChevronDown, ChevronRight, Clock, Calendar, Flag, Star, Edit2, Save, X } from 'lucide-react'
import type { Task } from '../../types/task.types'
import { useUpdateTaskStatus, useDeleteTask, useToggleUrgent, useToggleImportant, useUpdateTask } from '../../hooks/useTasks'
import { getEisenhowerQuadrant, getQuadrantColor, getQuadrantLabel } from '../../utils/priorityCalculator'
import { Button } from '../ui/Button'
import { TASK_STATUS, TASK_AREA } from '../../lib/constants'
import { formatDistanceToNow } from 'date-fns'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedNotes, setEditedNotes] = useState(task.notes || '')
  const [editedUrgent, setEditedUrgent] = useState(task.urgent)
  const [editedImportant, setEditedImportant] = useState(task.important)
  const [editedArea, setEditedArea] = useState(task.area || 'personal')
  const [editedEstimatedMinutes, setEditedEstimatedMinutes] = useState(task.estimated_minutes?.toString() || '')

  const updateStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const toggleUrgent = useToggleUrgent()
  const toggleImportant = useToggleImportant()
  const updateTask = useUpdateTask()

  const quadrant = getEisenhowerQuadrant(task)
  const quadrantColor = getQuadrantColor(quadrant)
  const quadrantLabel = getQuadrantLabel(quadrant)

  const handleStatusClick = () => {
    const statusFlow = {
      [TASK_STATUS.TODO]: TASK_STATUS.IN_PROGRESS,
      [TASK_STATUS.IN_PROGRESS]: TASK_STATUS.DONE,
      [TASK_STATUS.DONE]: TASK_STATUS.TODO,
    }
    const newStatus = statusFlow[task.status as keyof typeof statusFlow]
    updateStatus.mutate({ id: task.id, status: newStatus })
  }

  const handleDelete = () => {
    deleteTask.mutate(task.id)
    setShowDeleteConfirm(false)
  }

  const handleSaveEdit = () => {
    updateTask.mutate({
      id: task.id,
      updates: {
        title: editedTitle,
        notes: editedNotes || null,
        urgent: editedUrgent,
        important: editedImportant,
        area: editedArea,
        estimated_minutes: editedEstimatedMinutes ? parseInt(editedEstimatedMinutes) : null,
      },
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(task.title)
    setEditedNotes(task.notes || '')
    setEditedUrgent(task.urgent)
    setEditedImportant(task.important)
    setEditedArea(task.area || 'personal')
    setEditedEstimatedMinutes(task.estimated_minutes?.toString() || '')
    setIsEditing(false)
  }

  const statusIcon = {
    [TASK_STATUS.TODO]: '○',
    [TASK_STATUS.IN_PROGRESS]: '◐',
    [TASK_STATUS.DONE]: '●',
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${quadrantColor} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={handleStatusClick}
          className="text-2xl hover:scale-110 transition-transform"
          title={`Status: ${task.status}`}
        >
          {statusIcon[task.status as keyof typeof statusIcon]}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title and quadrant label */}
          <div className="flex items-center gap-2 mb-1">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 px-2 py-1 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <h3 className={`font-medium ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                {task.title}
              </h3>
            )}
            <span className="text-xs px-2 py-0.5 bg-white/50 rounded-full whitespace-nowrap">
              {quadrantLabel}
            </span>
          </div>

          {/* Task metadata */}
          <div className="flex flex-wrap gap-3 text-sm opacity-75 mb-2">
            {task.area && (
              <span className="capitalize">{task.area}</span>
            )}
            {task.estimated_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_minutes}min
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Notes section */}
          {isEditing ? (
            <div className="space-y-3 mb-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  className="w-full px-2 py-1 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Add notes..."
                />
              </div>

              {/* Edit flags */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setEditedUrgent(!editedUrgent)}
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
                    editedUrgent
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="w-3 h-3" />
                  {editedUrgent ? 'Urgent' : 'Not urgent'}
                </button>

                <button
                  onClick={() => setEditedImportant(!editedImportant)}
                  className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
                    editedImportant
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  {editedImportant ? 'Important' : 'Not important'}
                </button>
              </div>

              {/* Edit area and time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Area</label>
                  <select
                    value={editedArea}
                    onChange={(e) => setEditedArea(e.target.value as any)}
                    className="w-full px-2 py-1.5 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm capitalize"
                  >
                    <option value={TASK_AREA.WORK}>Work</option>
                    <option value={TASK_AREA.PERSONAL}>Personal</option>
                    <option value={TASK_AREA.HEALTH}>Health</option>
                    <option value={TASK_AREA.SOCIAL}>Social</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={editedEstimatedMinutes}
                    onChange={(e) => setEditedEstimatedMinutes(e.target.value)}
                    className="w-full px-2 py-1.5 border-2 border-blue-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="e.g. 30"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {(task.notes || isEditing) && (
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 mb-2"
                >
                  {showNotes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {showNotes ? 'Hide' : 'Show'} notes
                </button>
              )}

              {showNotes && task.notes && (
                <div className="text-sm bg-white/50 rounded p-3 mb-2 whitespace-pre-wrap">
                  {task.notes}
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-green-500 text-white hover:bg-green-600"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-white/50 hover:bg-gray-200"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-white/50 hover:bg-gray-200"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>

                <button
                  onClick={() => toggleUrgent.mutate({ id: task.id, urgent: !task.urgent })}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    task.urgent
                      ? 'bg-red-500 text-white'
                      : 'bg-white/50 hover:bg-red-100'
                  }`}
                  title={task.urgent ? 'Mark as not urgent' : 'Mark as urgent'}
                >
                  <Flag className="w-3 h-3" />
                  Urgent
                </button>

                <button
                  onClick={() => toggleImportant.mutate({ id: task.id, important: !task.important })}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    task.important
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/50 hover:bg-blue-100'
                  }`}
                  title={task.important ? 'Mark as not important' : 'Mark as important'}
                >
                  <Star className="w-3 h-3" />
                  Important
                </button>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="ml-auto px-2 py-1 rounded text-xs flex items-center gap-1 bg-white/50 hover:bg-red-100 text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-red-700">Delete this task?</span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handleDelete}
                      isLoading={deleteTask.isPending}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      No
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
