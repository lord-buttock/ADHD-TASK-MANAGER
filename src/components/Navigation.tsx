import { NavLink } from 'react-router-dom'
import { Target, ListTodo, Flame, TrendingUp, Settings, Mic, History } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { TASK_STATUS } from '../lib/constants'

export function Navigation() {
  const { data: tasks = [] } = useTasks()

  // Calculate badge counts
  const wipCount = tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length
  const incompleteTasks = tasks.filter((t) => t.status !== TASK_STATUS.DONE).length

  const navItems = [
    {
      to: '/',
      icon: Target,
      label: "Today's Focus",
      badge: wipCount > 0 ? wipCount : undefined,
    },
    {
      to: '/tasks',
      icon: ListTodo,
      label: 'All Tasks',
      badge: incompleteTasks > 0 ? incompleteTasks : undefined,
    },
    {
      to: '/meeting-recorder',
      icon: Mic,
      label: 'Record Meeting',
      badge: undefined,
    },
    {
      to: '/meeting-history',
      icon: History,
      label: 'Meeting History',
      badge: undefined,
    },
    {
      to: '/habits',
      icon: Flame,
      label: 'Habits',
      badge: undefined,
    },
    {
      to: '/insights',
      icon: TrendingUp,
      label: 'Insights',
      badge: undefined,
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      badge: undefined,
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-6">
            <h1 className="text-xl font-bold text-gray-900">ADHD Task Manager</h1>
          </div>
          <div className="flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto inline-block py-0.5 px-2 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Show only main items */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          {navItems
            .filter((item) =>
              ['/', '/tasks', '/meeting-recorder', '/habits', '/settings'].includes(item.to)
            )
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center relative transition-colors ${
                    isActive ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <item.icon className="h-5 w-5" />
                      {item.badge && (
                        <span className="absolute -top-2 -right-2 inline-block w-4 h-4 text-xs font-bold rounded-full bg-blue-500 text-white flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 ${isActive ? 'font-medium' : 'font-normal'}`}
                    >
                      {item.to === '/meeting-recorder' ? 'Record' : item.label.split(' ')[0]}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
        </div>
      </nav>
    </>
  )
}
