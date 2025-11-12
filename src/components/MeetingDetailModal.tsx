import { useState } from 'react'
import { X, FileText, ListChecks, StickyNote } from 'lucide-react'
import { Button } from './ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { transcriptService } from '../services/transcriptService'
import type { Database } from '../types/supabase'

type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

interface MeetingDetailModalProps {
  meeting: MeetingTranscript
  onClose: () => void
  onUpdate: () => void
}

type TabType = 'transcript' | 'summary' | 'notes'

export function MeetingDetailModal({ meeting, onClose, onUpdate }: MeetingDetailModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(meeting.notes || '')
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Load linked tasks when modal opens
  useState(() => {
    if (user) {
      setLoadingTasks(true)
      transcriptService
        .getMeetingTasks(meeting.id, user.id)
        .then((tasks) => setLinkedTasks(tasks))
        .catch((err) => console.error('Failed to load tasks:', err))
        .finally(() => setLoadingTasks(false))
    }
  })

  const handleSaveNotes = async () => {
    if (!user) return

    try {
      await transcriptService.updateMeetingNotes(meeting.id, user.id, notes)
      setEditingNotes(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to save notes:', err)
      alert('Failed to save notes')
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Imported'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{meeting.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(meeting.created_at).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' • '}
              {formatDuration(meeting.duration_seconds)}
              {' • '}
              {meeting.word_count} words
            </p>
          </div>
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
              onClick={() => setActiveTab('transcript')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transcript'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                <span>Transcript</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                <span>Notes</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'summary' && (
            <div>
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed mb-6">
                {meeting.summary}
              </p>

              {/* Linked Tasks */}
              {linkedTasks.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tasks from this meeting ({linkedTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {linkedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 ${
                              task.status === 'done'
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {task.status === 'done' && (
                              <svg className="w-full h-full text-white" viewBox="0 0 16 16">
                                <path
                                  fill="currentColor"
                                  d="M13.5 2.5L6 10L2.5 6.5L1 8l5 5l9-9z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                task.status === 'done'
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="capitalize">{task.status.replace('_', ' ')}</span>
                              {task.area && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{task.area}</span>
                                </>
                              )}
                              {task.due_date && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="prose max-w-none">
              <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {meeting.transcript}
              </p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {editingNotes ? (
                <div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your personal notes about this meeting..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNotes} size="sm">
                      Save Notes
                    </Button>
                    <Button
                      onClick={() => {
                        setNotes(meeting.notes || '')
                        setEditingNotes(false)
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {notes ? (
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">
                      {notes}
                    </p>
                  ) : (
                    <div className="text-center py-12">
                      <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No notes yet</p>
                    </div>
                  )}
                  <Button onClick={() => setEditingNotes(true)} variant="secondary" size="sm">
                    {notes ? 'Edit Notes' : 'Add Notes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
