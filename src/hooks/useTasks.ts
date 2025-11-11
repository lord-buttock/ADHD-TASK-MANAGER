import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskService } from '../services/taskService'
import type { TaskInsert, TaskUpdate } from '../types/task.types'
import type { TaskStatus, TaskArea } from '../lib/constants'

const TASKS_QUERY_KEY = 'tasks'

export function useTasks() {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: taskService.getTasks,
  })
}

export function useTasksByStatus(status: TaskStatus) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'status', status],
    queryFn: () => taskService.getTasksByStatus(status),
  })
}

export function useTasksByArea(area: TaskArea) {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'area', area],
    queryFn: () => taskService.getTasksByArea(area),
  })
}

export function useIncompleteTasks() {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, 'incomplete'],
    queryFn: taskService.getIncompleteTasks,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: TaskInsert) => taskService.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TaskUpdate }) =>
      taskService.updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useToggleUrgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, urgent }: { id: string; urgent: boolean }) =>
      taskService.toggleUrgent(id, urgent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useToggleImportant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, important }: { id: string; important: boolean }) =>
      taskService.toggleImportant(id, important),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}

export function useAppendNotes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      taskService.appendNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] })
    },
  })
}
