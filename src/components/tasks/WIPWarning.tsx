import { AlertTriangle } from 'lucide-react'
import { isWIPLimitExceeded, getWIPCount } from '../../utils/priorityCalculator'
import type { Task } from '../../types/task.types'
import { WIP_LIMIT } from '../../lib/constants'

interface WIPWarningProps {
  tasks: Task[]
}

export function WIPWarning({ tasks }: WIPWarningProps) {
  const wipCount = getWIPCount(tasks)
  const isExceeded = isWIPLimitExceeded(tasks, WIP_LIMIT)

  if (!isExceeded) {
    return null
  }

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-bold text-orange-900 mb-1">
          Too many tasks in progress!
        </h4>
        <p className="text-sm text-orange-800 mb-2">
          You have <strong>{wipCount} tasks in progress</strong>. For optimal focus, try to keep this under {WIP_LIMIT}.
        </p>
        <p className="text-xs text-orange-700">
          <strong>ADHD Tip:</strong> Finish what you've started before starting new tasks. This helps reduce overwhelm and increases completion rates.
        </p>
      </div>
    </div>
  )
}
