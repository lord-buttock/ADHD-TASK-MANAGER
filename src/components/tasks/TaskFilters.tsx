import { Filter } from 'lucide-react'
import { TASK_AREA, TASK_STATUS } from '../../lib/constants'
import type { TaskArea, TaskStatus } from '../../lib/constants'

interface TaskFiltersProps {
  selectedArea: TaskArea | 'all'
  selectedStatus: TaskStatus | 'all'
  showCompleted: boolean
  onAreaChange: (area: TaskArea | 'all') => void
  onStatusChange: (status: TaskStatus | 'all') => void
  onShowCompletedChange: (show: boolean) => void
}

export function TaskFilters({
  selectedArea,
  selectedStatus,
  showCompleted,
  onAreaChange,
  onStatusChange,
  onShowCompletedChange,
}: TaskFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Area filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onAreaChange('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedArea === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {Object.values(TASK_AREA).map((area) => (
              <button
                key={area}
                onClick={() => onAreaChange(area)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedArea === area
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onStatusChange('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onStatusChange(TASK_STATUS.TODO)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStatus === TASK_STATUS.TODO
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => onStatusChange(TASK_STATUS.IN_PROGRESS)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStatus === TASK_STATUS.IN_PROGRESS
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => onStatusChange(TASK_STATUS.DONE)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStatus === TASK_STATUS.DONE
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Done
            </button>
          </div>
        </div>

        {/* Show completed toggle */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => onShowCompletedChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show completed tasks</span>
          </label>
        </div>
      </div>
    </div>
  )
}
