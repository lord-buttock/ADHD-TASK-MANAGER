import type { Task } from '../types/task.types'

// Eisenhower Matrix quadrants
export type EisenhowerQuadrant =
  | 'urgent-important'     // Red - Do First
  | 'urgent-not-important' // Orange - Schedule
  | 'not-urgent-important' // Blue - Delegate
  | 'not-urgent-not-important' // Gray - Eliminate

export function getEisenhowerQuadrant(task: Task): EisenhowerQuadrant {
  if (task.urgent && task.important) return 'urgent-important'
  if (task.urgent && !task.important) return 'urgent-not-important'
  if (!task.urgent && task.important) return 'not-urgent-important'
  return 'not-urgent-not-important'
}

export function getQuadrantColor(quadrant: EisenhowerQuadrant): string {
  const colors = {
    'urgent-important': 'bg-red-100 border-red-400 text-red-900',
    'urgent-not-important': 'bg-orange-100 border-orange-400 text-orange-900',
    'not-urgent-important': 'bg-blue-100 border-blue-400 text-blue-900',
    'not-urgent-not-important': 'bg-gray-100 border-gray-400 text-gray-900',
  }
  return colors[quadrant]
}

export function getQuadrantLabel(quadrant: EisenhowerQuadrant): string {
  const labels = {
    'urgent-important': 'Do First',
    'urgent-not-important': 'Schedule',
    'not-urgent-important': 'Plan',
    'not-urgent-not-important': 'Eliminate',
  }
  return labels[quadrant]
}

// Calculate priority score (higher = more important to do now)
export function getPriorityScore(task: Task): number {
  let score = 0

  // Urgent tasks get highest priority
  if (task.urgent) score += 100

  // Important tasks get second highest priority
  if (task.important) score += 50

  // Pinned tasks get a boost
  if (task.is_pinned) score += 25

  // Tasks with due dates get priority based on proximity
  if (task.due_date) {
    const dueDate = new Date(task.due_date)
    const now = new Date()
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

    if (daysUntilDue < 0) {
      // Overdue - highest priority
      score += 200
    } else if (daysUntilDue < 1) {
      // Due today
      score += 75
    } else if (daysUntilDue < 3) {
      // Due within 3 days
      score += 40
    } else if (daysUntilDue < 7) {
      // Due within a week
      score += 20
    }
  }

  // In-progress tasks get a boost (to encourage completion)
  if (task.status === 'in-progress') score += 30

  return score
}

// Get the next recommended task
export function getNextTask(tasks: Task[]): Task | null {
  const incompleteTasks = tasks.filter(t => t.status !== 'done')

  if (incompleteTasks.length === 0) return null

  // Sort by priority score
  const sorted = [...incompleteTasks].sort((a, b) =>
    getPriorityScore(b) - getPriorityScore(a)
  )

  return sorted[0]
}

// Check if WIP limit is exceeded
export function isWIPLimitExceeded(tasks: Task[], limit: number = 3): boolean {
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length
  return inProgressCount > limit
}

// Get WIP count
export function getWIPCount(tasks: Task[]): number {
  return tasks.filter(t => t.status === 'in-progress').length
}
