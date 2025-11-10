import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/Button'
import { TaskList } from '../components/tasks/TaskList'
import { TaskForm } from '../components/tasks/TaskForm'
import { NextTaskCard } from '../components/tasks/NextTaskCard'
import { WIPWarning } from '../components/tasks/WIPWarning'
import { TaskFilters } from '../components/tasks/TaskFilters'
import type { TaskArea, TaskStatus } from '../lib/constants'

export function Dashboard() {
  const { user, signOut } = useAuth()
  const { data: tasks = [], isLoading, error } = useTasks()

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [selectedArea, setSelectedArea] = useState<TaskArea | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all')
  const [showCompleted, setShowCompleted] = useState(true)

  // Filter tasks based on selections
  const filteredTasks = tasks.filter((task) => {
    if (selectedArea !== 'all' && task.area !== selectedArea) return false
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    return true
  })

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
        {/* Add Task Button */}
        <div className="mb-6">
          <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Task
          </Button>
        </div>

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
            </div>
          </div>
        )}
      </main>

      {/* Task Form Modal */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  )
}
