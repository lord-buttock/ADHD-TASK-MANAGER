import type { Task } from '../../types/task.types'
import { TaskItem } from './TaskItem'
import { TASK_STATUS } from '../../lib/constants'

interface TaskListProps {
  tasks: Task[]
  groupByStatus?: boolean
  showCompleted?: boolean
}

export function TaskList({ tasks, groupByStatus = true, showCompleted = true }: TaskListProps) {
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter(t => t.status !== TASK_STATUS.DONE)

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No tasks yet</p>
        <p className="text-sm mt-2">Create your first task to get started!</p>
      </div>
    )
  }

  if (!groupByStatus) {
    return (
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    )
  }

  const todoTasks = filteredTasks.filter(t => t.status === TASK_STATUS.TODO)
  const inProgressTasks = filteredTasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS)
  const doneTasks = filteredTasks.filter(t => t.status === TASK_STATUS.DONE)

  return (
    <div className="space-y-6">
      {/* In Progress */}
      {inProgressTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-yellow-600">◐</span>
            In Progress
            <span className="text-sm font-normal text-gray-600">({inProgressTasks.length})</span>
          </h3>
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* To Do */}
      {todoTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-gray-600">○</span>
            To Do
            <span className="text-sm font-normal text-gray-600">({todoTasks.length})</span>
          </h3>
          <div className="space-y-3">
            {todoTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {showCompleted && doneTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="text-green-600">●</span>
            Done
            <span className="text-sm font-normal text-gray-600">({doneTasks.length})</span>
          </h3>
          <div className="space-y-3 opacity-60">
            {doneTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
