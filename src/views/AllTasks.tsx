import { useState } from 'react'
import { ChevronDown, ChevronRight, Search, Plus } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TaskList } from '../components/tasks/TaskList'
import { TaskForm } from '../components/tasks/TaskForm'
import { Button } from '../components/ui/Button'
import { TASK_STATUS, TASK_AREA, type TaskArea, type TaskStatus } from '../lib/constants'

export function AllTasks() {
  const { data: tasks = [], isLoading } = useTasks()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState<TaskArea | 'all'>('all')
  const [showUrgentOnly, setShowUrgentOnly] = useState(false)
  const [showImportantOnly, setShowImportantOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'priority' | 'due_date' | 'created_at' | 'title'>('priority')
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Section expansion states
  const [showTodo, setShowTodo] = useState(true)
  const [showInProgress, setShowInProgress] = useState(true)
  const [showDone, setShowDone] = useState(false)

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedArea !== 'all' && task.area !== selectedArea) return false
    if (showUrgentOnly && !task.urgent) return false
    if (showImportantOnly && !task.important) return false
    return true
  })

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title)
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    }
    if (sortBy === 'created_at') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    // Priority sorting (default)
    const priorityScore = (task: typeof a) => {
      let score = 0
      if (task.urgent) score += 2
      if (task.important) score += 1
      return score
    }
    return priorityScore(b) - priorityScore(a)
  })

  // Group by status
  const todoTasks = sortedTasks.filter((t) => t.status === TASK_STATUS.TODO)
  const inProgressTasks = sortedTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS)
  const doneTasks = sortedTasks.filter((t) => t.status === TASK_STATUS.DONE)

  // Stats
  const completedToday = doneTasks.filter(
    (task) =>
      task.updated_at &&
      new Date(task.updated_at).toDateString() === new Date().toDateString()
  ).length

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
          <h1 className="text-3xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-600 mt-1">
            {todoTasks.length} to do • {inProgressTasks.length} in progress • {completedToday} completed today
          </p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Area filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value as TaskArea | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 capitalize"
          >
            <option value="all">All Areas</option>
            <option value={TASK_AREA.WORK}>Work</option>
            <option value={TASK_AREA.PERSONAL}>Personal</option>
            <option value={TASK_AREA.HEALTH}>Health</option>
            <option value={TASK_AREA.SOCIAL}>Social</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="created_at">Sort by Created Date</option>
            <option value="title">Sort Alphabetically</option>
          </select>

          {/* Urgent/Important toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUrgentOnly(!showUrgentOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showUrgentOnly
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Urgent
            </button>
            <button
              onClick={() => setShowImportantOnly(!showImportantOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showImportantOnly
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Important
            </button>
          </div>
        </div>
      </div>

      {/* To Do Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowTodo(!showTodo)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showTodo ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <h2 className="text-xl font-bold">To Do ({todoTasks.length})</h2>
          </div>
        </button>
        {showTodo && (
          <div className="p-4 pt-0">
            {todoTasks.length > 0 ? (
              <TaskList tasks={todoTasks} groupByStatus={false} showCompleted={false} />
            ) : (
              <p className="text-gray-500 text-center py-8">No tasks to do</p>
            )}
          </div>
        )}
      </div>

      {/* In Progress Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowInProgress(!showInProgress)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showInProgress ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <h2 className="text-xl font-bold">In Progress ({inProgressTasks.length})</h2>
          </div>
        </button>
        {showInProgress && (
          <div className="p-4 pt-0">
            {inProgressTasks.length > 0 ? (
              <TaskList tasks={inProgressTasks} groupByStatus={false} showCompleted={false} />
            ) : (
              <p className="text-gray-500 text-center py-8">No tasks in progress</p>
            )}
          </div>
        )}
      </div>

      {/* Done Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowDone(!showDone)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showDone ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <h2 className="text-xl font-bold">Done ({doneTasks.length})</h2>
          </div>
        </button>
        {showDone && (
          <div className="p-4 pt-0">
            {doneTasks.length > 0 ? (
              <TaskList tasks={doneTasks} groupByStatus={false} showCompleted={true} />
            ) : (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            )}
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && <TaskForm onClose={() => setShowTaskForm(false)} />}
    </div>
  )
}
