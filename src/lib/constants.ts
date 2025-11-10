// Task statuses
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

// Task areas
export const TASK_AREA = {
  WORK: 'work',
  PERSONAL: 'personal',
  HEALTH: 'health',
  SOCIAL: 'social',
} as const

export type TaskArea = typeof TASK_AREA[keyof typeof TASK_AREA]

// Habit frequencies
export const HABIT_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const

export type HabitFrequency = typeof HABIT_FREQUENCY[keyof typeof HABIT_FREQUENCY]

// ADHD-specific constants
export const WIP_LIMIT = 3 // Maximum work-in-progress tasks
export const SEMANTIC_MATCH_THRESHOLD = 70 // Percentage for task matching
