import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks, useCreateTask, useIncompleteTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/Button'
import { TaskList } from '../components/tasks/TaskList'
import { TaskForm } from '../components/tasks/TaskForm'
import { NextTaskCard } from '../components/tasks/NextTaskCard'
import { WIPWarning } from '../components/tasks/WIPWarning'
import { TaskFilters } from '../components/tasks/TaskFilters'
import { QuickNote } from '../components/tasks/QuickNote'
import { TaskMatchReview } from '../components/tasks/TaskMatchReview'
import { AITaskReview } from '../components/tasks/AITaskReview'
import { findSimilarTasks, categorizeTasks } from '../services/aiService'
import { taskService } from '../services/taskService'
import type { TaskArea, TaskStatus } from '../lib/constants'
import type { TaskMatch, ParsedTask } from '../types/task.types'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { data: tasks = [], isLoading, error } = useTasks()
  const { data: incompleteTasks = [] } = useIncompleteTasks()
  const createTask = useCreateTask()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedArea, setSelectedArea] = useState<TaskArea | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all')
  const [showCompleted, setShowCompleted] = useState(true)

  // AI processing state
  const [currentNote, setCurrentNote] = useState('')
  const [matches, setMatches] = useState<TaskMatch[]>([])
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([])
  const [showMatchReview, setShowMatchReview] = useState(false)
  const [showTaskReview, setShowTaskReview] = useState(false)

  // Filter tasks based on selections
  const filteredTasks = tasks.filter((task) => {
    if (selectedArea !== 'all' && task.area !== selectedArea) return false
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    return true
  })

  // Handle QuickNote processing
  const handleProcessNote = async (note: string) => {
    setCurrentNote(note)

    // Step 1: Find similar tasks
    const foundMatches = await findSimilarTasks(note, incompleteTasks)

    if (foundMatches.length > 0) {
      // Show match review if similar tasks found
      setMatches(foundMatches)
      setShowMatchReview(true)
    } else {
      // No matches, proceed to AI categorization
      const categorized = await categorizeTasks(note)
      setParsedTasks(categorized)
      setShowTaskReview(true)
    }
  }

  // Handle merging note into existing task
  const handleMergeTask = async (taskId: string) => {
    await taskService.appendNotes(taskId, currentNote)
    setShowMatchReview(false)
    setCurrentNote('')
    setMatches([])
  }

  // Handle creating new tasks after match rejection
  const handleCreateNewAfterMatch = async () => {
    setShowMatchReview(false)
    const categorized = await categorizeTasks(currentNote)
    setParsedTasks(categorized)
    setShowTaskReview(true)
  }

  // Handle accepting AI-created tasks
  const handleAcceptTasks = async (tasksToCreate: ParsedTask[]) => {
    if (!user) return

    for (const task of tasksToCreate) {
      await createTask.mutateAsync({
        user_id: user.id,
        title: task.title,
        notes: task.notes,
        urgent: task.urgent,
        important: task.important,
        area: task.area,
        estimated_minutes: task.estimated_minutes,
        due_date: task.due_date,
      })
    }

    setShowTaskReview(false)
    setCurrentNote('')
    setParsedTasks([])
  }

  // Handle canceling AI review
  const handleCancelReview = () => {
    setShowMatchReview(false)
    setShowTaskReview(false)
    setMatches([])
    setParsedTasks([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ADHD Task Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Failed to load tasks. Please try refreshing the page.</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* QuickNote - PRIMARY INTERFACE */}
              <QuickNote onProcess={handleProcessNote} />

              {/* WIP Warning */}
              <WIPWarning tasks={tasks} />

              {/* Next Task Recommendation */}
              <NextTaskCard tasks={tasks} />

              {/* Task List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold mb-4">
                  All Tasks ({filteredTasks.length})
                </h2>
                <TaskList
                  tasks={filteredTasks}
                  groupByStatus={true}
                  showCompleted={showCompleted}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <TaskFilters
                selectedArea={selectedArea}
                selectedStatus={selectedStatus}
                showCompleted={showCompleted}
                onAreaChange={setSelectedArea}
                onStatusChange={setSelectedStatus}
                onShowCompletedChange={setShowCompleted}
              />

              {/* Manual Add Task - Secondary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Prefer manual entry?
                </p>
                <Button
                  onClick={() => setShowTaskForm(true)}
                  variant="secondary"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Manual Add Task
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}

      {showMatchReview && (
        <TaskMatchReview
          noteContent={currentNote}
          matches={matches}
          onMerge={handleMergeTask}
          onCreateNew={handleCreateNewAfterMatch}
          onCancel={handleCancelReview}
        />
      )}

      {showTaskReview && (
        <AITaskReview
          tasks={parsedTasks}
          onAcceptAll={() => handleAcceptTasks(parsedTasks)}
          onAccept={handleAcceptTasks}
          onCancel={handleCancelReview}
        />
      )}
    </div>
  )
}
