import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, FileText, Clock } from 'lucide-react'
import { LiveRecorder } from '../components/LiveRecorder'
import { ImportTranscript } from '../components/ImportTranscript'
import { MeetingReviewModal } from '../components/MeetingReviewModal'
import { useAuth } from '../contexts/AuthContext'
import { transcriptService } from '../services/transcriptService'
import type { ProcessedTranscript } from '../services/transcriptService'

type Tab = 'live' | 'import'

export function MeetingRecorder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('live')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [processedTranscript, setProcessedTranscript] = useState<ProcessedTranscript | null>(null)
  const [error, setError] = useState('')

  const handleTranscriptComplete = async (
    transcript: string,
    title: string,
    durationSeconds?: number
  ) => {
    if (!user) return

    setIsProcessing(true)
    setError('')

    try {
      setProcessingStep('Generating summary...')
      await new Promise((resolve) => setTimeout(resolve, 500)) // Brief delay for UX

      setProcessingStep('Extracting tasks...')
      await new Promise((resolve) => setTimeout(resolve, 500))

      setProcessingStep('Finding similar tasks...')
      const result = await transcriptService.processTranscript(
        transcript,
        user.id,
        title,
        durationSeconds
      )

      setProcessedTranscript(result)
      setIsProcessing(false)
    } catch (err) {
      console.error('Failed to process transcript:', err)
      setError(err instanceof Error ? err.message : 'Failed to process transcript')
      setIsProcessing(false)
    }
  }

  const handleModalClose = () => {
    setProcessedTranscript(null)
    // Stay on this page so user can record/import another meeting
  }

  const handleTasksAccepted = () => {
    setProcessedTranscript(null)
    navigate('/tasks')
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Meeting...</h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm text-gray-700">Transcribed</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processingStep.includes('summary')
                    ? 'bg-blue-500 animate-pulse'
                    : processingStep.includes('tasks') || processingStep.includes('similar')
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                {processingStep.includes('tasks') || processingStep.includes('similar') ? (
                  <span className="text-white text-xs">✓</span>
                ) : null}
              </div>
              <span
                className={`text-sm ${
                  processingStep.includes('summary') ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Generating summary...
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processingStep.includes('tasks')
                    ? 'bg-blue-500 animate-pulse'
                    : processingStep.includes('similar')
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              >
                {processingStep.includes('similar') ? (
                  <span className="text-white text-xs">✓</span>
                ) : null}
              </div>
              <span
                className={`text-sm ${
                  processingStep.includes('tasks') ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Extracting tasks...
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  processingStep.includes('similar') ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}
              />
              <span
                className={`text-sm ${
                  processingStep.includes('similar') ? 'text-gray-900 font-medium' : 'text-gray-600'
                }`}
              >
                Finding similar tasks...
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500">This may take 10-20 seconds...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Processing Failed</h3>
          <p className="text-sm text-red-800 mb-4">{error}</p>
          <button
            onClick={() => setError('')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meeting Recorder</h1>
        <p className="text-gray-600 mt-1">
          Record live or import transcripts to extract action items
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'live'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Live Recording</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Import Transcript</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'live' ? (
          <LiveRecorder onComplete={handleTranscriptComplete} />
        ) : (
          <ImportTranscript onComplete={handleTranscriptComplete} />
        )}
      </div>

      {/* Review Modal */}
      {processedTranscript && (
        <MeetingReviewModal
          processedTranscript={processedTranscript}
          onClose={handleModalClose}
          onTasksAccepted={handleTasksAccepted}
        />
      )}
    </div>
  )
}
