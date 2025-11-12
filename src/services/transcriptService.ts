import { supabase } from '../lib/supabase'
import { callClaudeAPI } from './aiService'
import { findSimilarTasks } from './aiService'
import type { Database } from '../types/supabase'

type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

export interface ExtractedTask {
  title: string
  urgent: boolean
  important: boolean
  dueDate?: string
  assignedTo?: string
  estimatedMinutes?: number
  area: 'work' | 'personal' | 'health' | 'social'
  context: string
}

export interface ProcessedTranscript {
  meetingId: string
  transcript: string
  summary: string
  tasks: Array<ExtractedTask & { similarTasks: Task[] }>
}

/**
 * Generate AI summary of meeting transcript
 */
export async function generateMeetingSummary(transcript: string): Promise<string> {
  const prompt = `
Summarize this meeting transcript in 2-3 concise paragraphs.
Focus on:
- Key decisions made
- Main discussion points
- Action items agreed upon
- Important context

Keep it brief but informative. Write in past tense.

Transcript:
${transcript}
`

  const response = await callClaudeAPI(prompt, {
    maxTokens: 500,
    temperature: 0.3,
  })

  return response
}

/**
 * Extract actionable tasks from meeting transcript using AI
 */
export async function extractTasks(transcript: string): Promise<ExtractedTask[]> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const prompt = `
Extract ALL action items and tasks from this meeting transcript.

For each task, determine:
1. Clear, actionable title (imperative form: "Email parents", not "We should email")
2. Urgency (boolean): Is there a deadline or time pressure? true for ASAP/today/this week, false otherwise
3. Importance (boolean): Are there significant consequences if not done? true for high-value/critical tasks, false for nice-to-have
4. Due date: Extract any mentioned dates and convert to YYYY-MM-DD format
5. Assigned to: Who will do it? ("Phill will...", "I need to...", "You should...")
6. Estimated time: How long might it take in minutes? (15, 30, 60, 120, etc.)
7. Area: Categorize as work, personal, health, or social
8. Context: Quote the relevant part of transcript (1-2 sentences max)

IMPORTANT FOR DUE DATES:
- Today's date is: ${todayStr}
- Convert all dates to YYYY-MM-DD format (e.g., "2024-11-15")
- "by Friday" → calculate the actual date and use YYYY-MM-DD
- "next week" → use null (no specific date mentioned)
- "end of week" → use the date for Friday of this week in YYYY-MM-DD format
- "tomorrow" → add 1 day to today's date
- If no specific date mentioned, use null

Transcript:
${transcript}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "tasks": [
    {
      "title": "Email parents about excursion",
      "urgent": true,
      "important": true,
      "dueDate": "2024-11-15",
      "assignedTo": "Phill",
      "estimatedMinutes": 30,
      "area": "work",
      "context": "Sarah: Can you email all the parents by Friday with the details?"
    }
  ]
}

CRITICAL DATA TYPES:
- urgent: MUST be boolean (true or false)
- important: MUST be boolean (true or false)
- estimatedMinutes: MUST be number (30, 60, etc.) or null
- dueDate: MUST be null OR a valid YYYY-MM-DD date string
- NO natural language dates like "end of week" or "Friday"
- NO string values like "critical" or "high" for boolean fields
- Response must be valid JSON only. No other text. No markdown code fences.
`

  const response = await callClaudeAPI(prompt, {
    maxTokens: 2000,
    temperature: 0.3,
  })

  // Strip any markdown code fences if present
  let jsonText = response.trim()
  jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const parsed = JSON.parse(jsonText)
    return parsed.tasks || []
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    console.error('Response was:', jsonText)
    throw new Error('Failed to extract tasks from transcript')
  }
}

/**
 * Process a transcript: generate summary, extract tasks, find similar tasks
 */
export async function processTranscript(
  transcript: string,
  userId: string,
  meetingTitle?: string,
  durationSeconds?: number
): Promise<ProcessedTranscript> {
  // 1. Generate summary
  const summary = await generateMeetingSummary(transcript)

  // 2. Extract tasks
  const extractedTasks = await extractTasks(transcript)

  // 3. For each task, find similar existing tasks
  const tasksWithMatches = await Promise.all(
    extractedTasks.map(async (task) => {
      const similarTasks = await findSimilarTasks(task.title, userId)
      return {
        ...task,
        similarTasks,
      }
    })
  )

  // 4. Save transcript to database
  const wordCount = transcript.split(/\s+/).length

  const { data: meeting, error } = await supabase
    .from('meeting_transcripts')
    .insert({
      user_id: userId,
      title: meetingTitle || `Meeting ${new Date().toLocaleDateString()}`,
      transcript: transcript,
      summary: summary,
      duration_seconds: durationSeconds || null,
      word_count: wordCount,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  return {
    meetingId: meeting.id,
    transcript,
    summary,
    tasks: tasksWithMatches,
  }
}

/**
 * Merge extracted task with existing task
 */
export async function mergeTaskWithExisting(
  newTask: ExtractedTask,
  existingTaskId: string,
  meetingId: string
): Promise<void> {
  // Get existing task
  const { data: existingTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', existingTaskId)
    .single()

  if (fetchError) throw fetchError

  const existing = existingTask as Task

  // Append new context to existing task notes
  const timestamp = new Date().toLocaleString()
  const meetingContext = `\n\n[Added from meeting ${timestamp}]\n${newTask.context}\nDue: ${
    newTask.dueDate || 'Not specified'
  }`

  const updatedNotes = (existing.notes || '') + meetingContext

  // Update existing task
  const { error } = await supabase
    .from('tasks')
    .update({
      notes: updatedNotes,
      due_date: newTask.dueDate || existing.due_date,
      urgent: newTask.urgent || existing.urgent,
      important: newTask.important || existing.important,
      meeting_id: meetingId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingTaskId)

  if (error) throw error
}

/**
 * Create new task from extracted task
 */
export async function createTaskFromExtracted(
  task: ExtractedTask,
  userId: string,
  meetingId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: task.title,
      urgent: task.urgent,
      important: task.important,
      status: 'todo' as const,
      area: (task.area || 'work') as 'work' | 'personal' | 'health' | 'social',
      due_date: task.dueDate || null,
      estimated_minutes: task.estimatedMinutes || null,
      notes: `From meeting:\n${task.context}`,
      meeting_id: meetingId,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return (data as { id: string }).id
}

/**
 * Get all meeting transcripts for a user
 */
export async function getMeetingTranscripts(userId: string): Promise<MeetingTranscript[]> {
  const { data, error } = await supabase
    .from('meeting_transcripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get single meeting transcript by ID
 */
export async function getMeetingTranscript(
  meetingId: string,
  userId: string
): Promise<MeetingTranscript | null> {
  const { data, error } = await supabase
    .from('meeting_transcripts')
    .select('*')
    .eq('id', meetingId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data
}

/**
 * Get tasks linked to a meeting
 */
export async function getMeetingTasks(meetingId: string, userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('meeting_id', meetingId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Delete meeting transcript
 */
export async function deleteMeetingTranscript(
  meetingId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_transcripts')
    .delete()
    .eq('id', meetingId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Update meeting summary
 */
export async function updateMeetingSummary(
  meetingId: string,
  userId: string,
  summary: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_transcripts')
    .update({ summary } as any)
    .eq('id', meetingId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Update meeting notes
 */
export async function updateMeetingNotes(
  meetingId: string,
  userId: string,
  notes: string
): Promise<void> {
  const { error } = await supabase
    .from('meeting_transcripts')
    .update({ notes } as any)
    .eq('id', meetingId)
    .eq('user_id', userId)

  if (error) throw error
}

export const transcriptService = {
  processTranscript,
  generateMeetingSummary,
  extractTasks,
  mergeTaskWithExisting,
  createTaskFromExtracted,
  getMeetingTranscripts,
  getMeetingTranscript,
  getMeetingTasks,
  deleteMeetingTranscript,
  updateMeetingSummary,
  updateMeetingNotes,
}
