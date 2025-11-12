import { useState, useEffect } from 'react'
import { Clock, FileText, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { transcriptService } from '../services/transcriptService'
import { MeetingDetailModal } from '../components/MeetingDetailModal'
import type { Database } from '../types/supabase'

type MeetingTranscript = Database['public']['Tables']['meeting_transcripts']['Row']

interface GroupedMeetings {
  [date: string]: MeetingTranscript[]
}

export function MeetingHistory() {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState<MeetingTranscript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingTranscript | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadMeetings()
  }, [user])

  const loadMeetings = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const data = await transcriptService.getMeetingTranscripts(user.id)
      setMeetings(data)
    } catch (err) {
      console.error('Failed to load meetings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (meetingId: string) => {
    if (!user) return
    if (!confirm('Are you sure you want to delete this meeting transcript?')) return

    setDeletingId(meetingId)
    try {
      await transcriptService.deleteMeetingTranscript(meetingId, user.id)
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
    } catch (err) {
      console.error('Failed to delete meeting:', err)
      alert('Failed to delete meeting')
    } finally {
      setDeletingId(null)
    }
  }

  // Group meetings by date
  const groupedMeetings: GroupedMeetings = meetings.reduce((acc, meeting) => {
    const date = new Date(meeting.created_at).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(meeting)
    return acc
  }, {} as GroupedMeetings)

  // Get date labels (Today, Yesterday, or full date)
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    return dateString
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Imported'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meeting History</h1>
        <p className="text-gray-600 mt-1">View and manage your meeting transcripts</p>
      </div>

      {/* Empty state */}
      {meetings.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No meetings yet</h3>
            <p className="text-gray-600 mb-6">
              Record or import meeting transcripts to see them here.
            </p>
          </div>
        </div>
      )}

      {/* Grouped meetings */}
      {Object.entries(groupedMeetings).map(([dateString, dateMeetings]) => (
        <div key={dateString} className="space-y-3">
          {/* Date header */}
          <h2 className="text-lg font-semibold text-gray-900 sticky top-0 bg-gray-50 py-2 z-10">
            {getDateLabel(dateString)}
          </h2>

          {/* Meeting cards for this date */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dateMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setSelectedMeeting(meeting)}
                  className="w-full p-4 text-left"
                >
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {meeting.title}
                  </h3>

                  {/* Summary preview */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {meeting.summary || 'No summary available'}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(meeting.created_at).toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span>•</span>
                    <span>{formatDuration(meeting.duration_seconds)}</span>
                    <span>•</span>
                    <span>{meeting.word_count} words</span>
                  </div>
                </button>

                {/* Delete button */}
                <div className="border-t border-gray-100 px-4 py-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(meeting.id)
                    }}
                    disabled={deletingId === meeting.id}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 p-1"
                    title="Delete meeting"
                  >
                    {deletingId === meeting.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Detail Modal */}
      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={() => {
            loadMeetings()
            // Update the selected meeting in state
            const updated = meetings.find((m) => m.id === selectedMeeting.id)
            if (updated) setSelectedMeeting(updated)
          }}
        />
      )}
    </div>
  )
}
