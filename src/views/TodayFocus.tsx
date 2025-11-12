import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTasks, useIncompleteTasks, useCreateTask, useAppendNotes } from '../hooks/useTasks'
import { NextTaskCard } from '../components/tasks/NextTaskCard'
import { TaskList } from '../components/tasks/TaskList'
import { QuickNote } from '../components/tasks/QuickNote'
import { AITaskReview } from '../components/tasks/AITaskReview'
import { Button } from '../components/ui/Button'
import { TASK_STATUS } from '../lib/constants'
import { findSimilarTasks, categorizeTasks } from '../services/aiService'
import type { ParsedTaskWithMatches } from '../types/task.types'
import { useAuth } from '../contexts/AuthContext'

export function TodayFocus() {
  const { user } = useAuth()
  const { data: tasks = [], isLoading } = useTasks()
  const { data: incompleteTasks = [] } = useIncompleteTasks()
  const createTask = useCreateTask()
  const appendNotes = useAppendNotes()

  const [showQuickNote, setShowQuickNote] = useState(false)
  const [tasksWithMatches, setTasksWithMatches] = useState<ParsedTaskWithMatches[]>([])
  const [showTaskReview, setShowTaskReview] = useState(false)

  // Filter tasks for today's focus
  const inProgressTasks = tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS)
  const completedToday = tasks.filter(
    (task) =>
      task.status === TASK_STATUS.DONE &&
      task.updated_at &&
      new Date(task.updated_at).toDateString() === new Date().toDateString()
  )

  // Handle QuickNote processing
  const handleProcessNote = async (note: string) => {
    const categorized = await categorizeTasks(note)
    const results: ParsedTaskWithMatches[] = await Promise.all(
      categorized.map(async (parsedTask) => {
        const matches = await findSimilarTasks(parsedTask.title, incompleteTasks)
        return {
          parsedTask,
          matches,
          action: matches.length > 0 ? undefined : 'create',
        }
      })
    )

    setTasksWithMatches(results)
    setShowTaskReview(true)
    setShowQuickNote(false)
  }

  const handleAcceptTasks = async (tasksToProcess: ParsedTaskWithMatches[]) => {
    if (!user) return

    for (const item of tasksToProcess) {
      if (item.action === 'merge' && item.mergeIntoTaskId) {
        const noteToAdd = item.parsedTask.notes
          ? `${item.parsedTask.title}\n${item.parsedTask.notes}`
          : item.parsedTask.title
        await appendNotes.mutateAsync({ id: item.mergeIntoTaskId, notes: noteToAdd })
      } else if (item.action === 'create') {
        await createTask.mutateAsync({
          user_id: user.id,
          title: item.parsedTask.title,
          notes: item.parsedTask.notes,
          urgent: item.parsedTask.urgent,
          important: item.parsedTask.important,
          area: item.parsedTask.area,
          estimated_minutes: item.parsedTask.estimated_minutes,
          due_date: item.parsedTask.due_date,
        })
      }
    }

    setShowTaskReview(false)
    setTasksWithMatches([])
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Focus</h1>
          <p className="text-gray-600 mt-1">
            {completedToday.length} completed today • {inProgressTasks.length} in progress
          </p>
        </div>
        <Button onClick={() => setShowQuickNote(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Quick Note
        </Button>
      </div>

      {/* Next Task Recommendation */}
      <NextTaskCard tasks={tasks} />

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">In Progress ({inProgressTasks.length})</h2>
          <TaskList tasks={inProgressTasks} groupByStatus={false} showCompleted={false} />
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tasks yet!</h3>
            <p className="text-gray-600 mb-6">Use Quick Note to get started with your first task.</p>
            <Button onClick={() => setShowQuickNote(true)} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Task
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showQuickNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Quick Note</h2>
              <button onClick={() => setShowQuickNote(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <QuickNote onProcess={handleProcessNote} />
          </div>
        </div>
      )}

      {showTaskReview && (
        <AITaskReview
          tasksWithMatches={tasksWithMatches}
          onAccept={handleAcceptTasks}
          onCancel={() => {
            setShowTaskReview(false)
            setTasksWithMatches([])
          }}
        />
      )}
    </div>
  )
}
