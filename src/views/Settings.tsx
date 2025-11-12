import { useState } from 'react'
import { LogOut, Download, Trash2, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { Button } from '../components/ui/Button'
import { TASK_AREA } from '../lib/constants'

export function Settings() {
  const { user, signOut } = useAuth()
  const { data: tasks = [] } = useTasks()

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'auto')
  const [wipLimit, setWipLimit] = useState(Number(localStorage.getItem('wipLimit')) || 3)
  const [defaultArea, setDefaultArea] = useState(localStorage.getItem('defaultArea') || 'personal')

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleWipLimitChange = (newLimit: number) => {
    setWipLimit(newLimit)
    localStorage.setItem('wipLimit', newLimit.toString())
  }

  const handleDefaultAreaChange = (newArea: string) => {
    setDefaultArea(newArea)
    localStorage.setItem('defaultArea', newArea)
  }

  const handleExportData = () => {
    const data = {
      tasks,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adhd-task-manager-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearCompleted = () => {
    if (confirm('Are you sure you want to delete all completed tasks? This cannot be undone.')) {
      // Will implement in Phase 5 with proper delete functionality
      alert('This feature will be available soon!')
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your preferences and account</p>
      </div>

      {/* User Profile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Preferences</h2>
        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {['auto', 'light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`px-4 py-2 rounded-lg border-2 capitalize transition-colors ${
                    theme === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Dark mode will be fully implemented in Phase 7</p>
          </div>

          {/* WIP Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work-in-Progress Limit
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={wipLimit}
              onChange={(e) => handleWipLimitChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll get a warning when you have more than {wipLimit} tasks in progress
            </p>
          </div>

          {/* Default Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Task Area</label>
            <select
              value={defaultArea}
              onChange={(e) => handleDefaultAreaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 capitalize"
            >
              <option value={TASK_AREA.WORK}>Work</option>
              <option value={TASK_AREA.PERSONAL}>Personal</option>
              <option value={TASK_AREA.HEALTH}>Health</option>
              <option value={TASK_AREA.SOCIAL}>Social</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Data Management</h2>
        <div className="space-y-3">
          <Button
            onClick={handleExportData}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All Data
          </Button>
          <Button
            onClick={handleClearCompleted}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear Completed Tasks
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">About</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Version</span>
            <span className="text-gray-900 font-medium">1.0.0 (Phase 4)</span>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              Terms of Service
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
            >
              Help & Support
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <Button
          onClick={handleSignOut}
          variant="danger"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
