import { supabase } from '../lib/supabase'
import type { Task, TaskInsert, TaskUpdate } from '../types/task.types'
import type { TaskStatus, TaskArea } from '../lib/constants'

export const taskService = {
  // Fetch all tasks for the current user
  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Fetch tasks by status
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Fetch tasks by area
  async getTasksByArea(area: TaskArea): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('area', area)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Fetch incomplete tasks (for semantic matching in Phase 3)
  async getIncompleteTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['todo', 'in-progress'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create a new task
  async createTask(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a task
  async updateTask(id: string, updates: TaskUpdate): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update task status
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return taskService.updateTask(id, { status })
  },

  // Toggle task urgency
  async toggleUrgent(id: string, urgent: boolean): Promise<Task> {
    return taskService.updateTask(id, { urgent })
  },

  // Toggle task importance
  async toggleImportant(id: string, important: boolean): Promise<Task> {
    return taskService.updateTask(id, { important })
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Append notes to existing task (for Phase 3 AI merging)
  async appendNotes(id: string, newNotes: string): Promise<Task> {
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const currentNotes = task.notes || ''
    const timestamp = new Date().toISOString()
    const updatedNotes = currentNotes
      ? `${currentNotes}\n\n---\nAdded ${new Date(timestamp).toLocaleDateString()}:\n${newNotes}`
      : newNotes

    // Update note_history
    const noteHistory = Array.isArray(task.note_history) ? task.note_history : []
    noteHistory.push({
      added_at: timestamp,
      content: newNotes,
      source: 'quick_note',
    })

    return taskService.updateTask(id, {
      notes: updatedNotes,
      note_history: noteHistory,
    })
  },
}
