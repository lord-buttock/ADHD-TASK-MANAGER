import { useState } from 'react'
import { X, CheckCircle, FileText, ListTodo, FileText as TranscriptIcon } from 'lucide-react'
import { Button } from './ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { transcriptService } from '../services/transcriptService'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import type { ProcessedTranscript, ExtractedTask } from '../services/transcriptService'
import type { Database } from '../types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface MeetingReviewModalProps {
  processedTranscript: ProcessedTranscript
  onClose: () => void
  onTasksAccepted: () => void
}

type TabType = 'summary' | 'tasks' | 'transcript'

type TaskDecision = 'pending' | 'create' | 'merge' | 'skip'

interface TaskState {
  task: ExtractedTask & { similarTasks: Task[] }
  decision: TaskDecision
  mergeWithId?: string
}

export function MeetingReviewModal({
  processedTranscript,
  onClose,
  onTasksAccepted,
}: MeetingReviewModalProps) {
  const { user } = useAuth()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [taskStates, setTaskStates] = useState<TaskState[]>(() =>
    processedTranscript.tasks.map((task) => ({
      task,
      decision: 'pending',
    }))
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingSummary, setEditingSummary] = useState(false)
  const [summary, setSummary] = useState(processedTranscript.summary)

  const getEisenhowerBadge = (urgent: boolean, important: boolean) => {
    if (urgent && important) {
      return { label: 'DO FIRST', color: 'bg-red-100 text-red-700 border-red-200' }
    } else if (urgent && !important) {
      return { label: 'DELEGATE', color: 'bg-orange-100 text-orange-700 border-orange-200' }
    } else if (!urgent && important) {
      return { label: 'SCHEDULE', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    } else {
      return { label: 'LOW PRIORITY', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    }
  }

  const handleTaskDecision = (index: number, decision: TaskDecision, mergeWithId?: string) => {
    setTaskStates((prev) =>
      prev.map((state, i) => (i === index ? { ...state, decision, mergeWithId } : state))
    )
  }

  const handleAcceptAll = async () => {
    if (!user) return

    setIsProcessing(true)

    try {
      for (let i = 0; i < taskStates.length; i++) {
        const state = taskStates[i]
        console.log(`Processing task ${i + 1}/${taskStates.length}:`, state.task.title, 'Decision:', state.decision)

        if (state.decision === 'skip') {
          console.log('  -> Skipping')
          continue
        }

        if (state.decision === 'merge' && state.mergeWithId) {
          console.log('  -> Merging with existing task:', state.mergeWithId)

          // Get existing task to append notes
          const { data: existingTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', state.mergeWithId)
            .single()

          if (existingTask) {
            const timestamp = new Date().toLocaleString()
            const meetingContext = `\n\n[Added from meeting ${timestamp}]\n${state.task.context}\nDue: ${
              state.task.dueDate || 'Not specified'
            }`
            const updatedNotes = (existingTask.notes || '') + meetingContext

            // Use React Query mutation for cache invalidation
            await updateTask.mutateAsync({
              id: state.mergeWithId,
              updates: {
                notes: updatedNotes,
                due_date: state.task.dueDate || existingTask.due_date,
                urgent: state.task.urgent || existingTask.urgent,
                important: state.task.important || existingTask.important,
                meeting_id: processedTranscript.meetingId,
                updated_at: new Date().toISOString(),
              },
            })
          }
        } else if (state.decision === 'create' || state.decision === 'pending') {
          // Pending tasks default to "create new" if they have no similar tasks,
          // or "merge with first" if they do
          if (state.task.similarTasks.length > 0 && state.decision === 'pending') {
            console.log('  -> Merging with similar task (pending):', state.task.similarTasks[0].id)

            const existingTask = state.task.similarTasks[0]
            const timestamp = new Date().toLocaleString()
            const meetingContext = `\n\n[Added from meeting ${timestamp}]\n${state.task.context}\nDue: ${
              state.task.dueDate || 'Not specified'
            }`
            const updatedNotes = (existingTask.notes || '') + meetingContext

            await updateTask.mutateAsync({
              id: existingTask.id,
              updates: {
                notes: updatedNotes,
                due_date: state.task.dueDate || existingTask.due_date,
                urgent: state.task.urgent || existingTask.urgent,
                important: state.task.important || existingTask.important,
                meeting_id: processedTranscript.meetingId,
                updated_at: new Date().toISOString(),
              },
            })
          } else {
            console.log('  -> Creating new task')

            // Use React Query mutation for cache invalidation
            await createTask.mutateAsync({
              user_id: user.id,
              title: state.task.title,
              urgent: state.task.urgent,
              important: state.task.important,
              status: 'todo',
              area: state.task.area || 'work',
              due_date: state.task.dueDate || null,
              estimated_minutes: state.task.estimatedMinutes || null,
              notes: `From meeting:\n${state.task.context}`,
              meeting_id: processedTranscript.meetingId,
              created_at: new Date().toISOString(),
            })
          }
        }
        console.log('  -> Success!')
      }

      console.log('All tasks processed successfully')
      onTasksAccepted()
    } catch (err) {
      console.error('Failed to process tasks:', err)
      alert('Failed to process some tasks. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveSummary = async () => {
    if (!user) return

    try {
      await transcriptService.updateMeetingSummary(
        processedTranscript.meetingId,
        user.id,
        summary
      )
      setEditingSummary(false)
    } catch (err) {
      console.error('Failed to update summary:', err)
      alert('Failed to save summary')
    }
  }

  const pendingCount = taskStates.filter((s) => s.decision === 'pending').length
  const acceptedCount = taskStates.filter((s) => s.decision !== 'skip' && s.decision !== 'pending')
    .length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Meeting Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex px-6 -mb-px">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Summary</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                <span>Tasks ({taskStates.length})</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transcript'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <TranscriptIcon className="w-4 h-4" />
                <span>Transcript</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && (
            <div>
              {editingSummary ? (
                <div>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSummary} size="sm">
                      Save
                    </Button>
                    <Button onClick={() => setEditingSummary(false)} variant="secondary" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">{summary}</p>
                  <Button onClick={() => setEditingSummary(true)} variant="secondary" size="sm">
                    Edit Summary
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Found {taskStates.length} action{taskStates.length !== 1 ? 's' : ''} item
                  {taskStates.length !== 1 ? 's' : ''}. Review each task below and choose whether
                  to merge with existing tasks or create new ones.
                </p>
              </div>

              {taskStates.map((state, index) => {
                const badge = getEisenhowerBadge(state.task.urgent, state.task.important)

                return (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                    {/* Task Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{state.task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {state.task.dueDate && (
                            <span className="text-gray-600">
                              Due: {new Date(state.task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {state.task.area && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded capitalize">
                              {state.task.area}
                            </span>
                          )}
                          {state.task.estimatedMinutes && (
                            <span className="text-gray-600">~{state.task.estimatedMinutes} min</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Context */}
                    <div className="mb-4 pl-8">
                      <p className="text-sm text-gray-600 italic">"{state.task.context}"</p>
                    </div>

                    {/* Similar Tasks */}
                    {state.task.similarTasks.length > 0 && (
                      <div className="mb-4 pl-8">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Similar existing task found:
                        </p>
                        {state.task.similarTasks.slice(0, 1).map((similar) => (
                          <div key={similar.id} className="bg-white border border-gray-200 rounded p-3">
                            <p className="font-medium text-gray-900">{similar.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {similar.status.replace('_', ' ').toUpperCase()} •{' '}
                              {new Date(similar.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pl-8">
                      {state.task.similarTasks.length > 0 ? (
                        <>
                          <Button
                            onClick={() =>
                              handleTaskDecision(index, 'merge', state.task.similarTasks[0].id)
                            }
                            variant={state.decision === 'merge' ? 'primary' : 'secondary'}
                            size="sm"
                          >
                            {state.decision === 'merge' ? '✓ ' : ''}Merge with existing
                          </Button>
                          <Button
                            onClick={() => handleTaskDecision(index, 'create')}
                            variant={state.decision === 'create' ? 'primary' : 'secondary'}
                            size="sm"
                          >
                            {state.decision === 'create' ? '✓ ' : ''}Create new task
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleTaskDecision(index, 'create')}
                          variant={state.decision === 'create' ? 'primary' : 'secondary'}
                          size="sm"
                        >
                          {state.decision === 'create' ? '✓ ' : ''}Create task
                        </Button>
                      )}
                      <Button
                        onClick={() => handleTaskDecision(index, 'skip')}
                        variant={state.decision === 'skip' ? 'primary' : 'secondary'}
                        size="sm"
                        className={state.decision === 'skip' ? 'bg-gray-600' : ''}
                      >
                        {state.decision === 'skip' ? '✓ ' : ''}Skip
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="prose max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {processedTranscript.transcript}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {pendingCount > 0 ? (
                <span>{pendingCount} task{pendingCount !== 1 ? 's' : ''} to review</span>
              ) : (
                <span>
                  {acceptedCount} task{acceptedCount !== 1 ? 's' : ''} ready to process
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={onClose} variant="secondary">
                Cancel
              </Button>
              <Button onClick={handleAcceptAll} isLoading={isProcessing} disabled={isProcessing}>
                {pendingCount > 0 ? 'Accept All' : 'Process Tasks'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
