import { useState } from 'react'
import { FileText, Upload, AlertCircle } from 'lucide-react'
import mammoth from 'mammoth'
import { Button } from './ui/Button'

interface ImportTranscriptProps {
  onComplete: (transcript: string, title: string) => void
}

const MAX_CHARACTERS = 50000
const MIN_CHARACTERS = 50

export function ImportTranscript({ onComplete }: ImportTranscriptProps) {
  const [transcript, setTranscript] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleTextChange = (text: string) => {
    if (text.length > MAX_CHARACTERS) {
      setError(`Maximum ${MAX_CHARACTERS.toLocaleString()} characters allowed`)
      return
    }
    setError('')
    setTranscript(text)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      // Check file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      let text = ''

      if (file.type === 'text/plain') {
        text = await file.text()
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        text = result.value
      } else {
        throw new Error('Unsupported file type. Please use .txt or .docx files.')
      }

      if (text.length > MAX_CHARACTERS) {
        throw new Error(`File content exceeds ${MAX_CHARACTERS.toLocaleString()} characters`)
      }

      setTranscript(text)

      // Suggest meeting title from filename
      if (!meetingTitle) {
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        setMeetingTitle(fileName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setIsUploading(false)
      // Reset input so same file can be uploaded again
      event.target.value = ''
    }
  }

  const handleSubmit = () => {
    const trimmed = transcript.trim()

    if (trimmed.length < MIN_CHARACTERS) {
      setError(`Transcript must be at least ${MIN_CHARACTERS} characters`)
      return
    }

    if (trimmed.length > MAX_CHARACTERS) {
      setError(`Transcript must not exceed ${MAX_CHARACTERS.toLocaleString()} characters`)
      return
    }

    setError('')
    onComplete(trimmed, meetingTitle || `Meeting ${new Date().toLocaleDateString()}`)
  }

  const characterCount = transcript.length
  const isValid = characterCount >= MIN_CHARACTERS && characterCount <= MAX_CHARACTERS

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Import Transcript</h2>
          <p className="text-gray-600">
            Paste a transcript from any source or upload a file
          </p>
        </div>

        {/* Source suggestions */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Works with:</p>
          <div className="flex flex-wrap gap-2 text-sm text-blue-800">
            <span className="px-2 py-1 bg-blue-100 rounded">TwinMind</span>
            <span className="px-2 py-1 bg-blue-100 rounded">Otter.ai</span>
            <span className="px-2 py-1 bg-blue-100 rounded">Voice Memos</span>
            <span className="px-2 py-1 bg-blue-100 rounded">Meeting Notes</span>
            <span className="px-2 py-1 bg-blue-100 rounded">Any text source</span>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-6">
          <label htmlFor="transcript-input" className="block text-sm font-medium text-gray-700 mb-2">
            Paste transcript:
          </label>
          <textarea
            id="transcript-input"
            value={transcript}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste your meeting transcript here..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p
              className={`text-sm ${
                characterCount > MAX_CHARACTERS
                  ? 'text-red-600 font-medium'
                  : characterCount >= MIN_CHARACTERS
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`}
            >
              {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters
              {characterCount > 0 && characterCount < MIN_CHARACTERS &&
                ` (minimum ${MIN_CHARACTERS} required)`
              }
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 uppercase tracking-wide font-medium">
              OR
            </span>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload file:</label>
          <div className="flex items-center gap-3">
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Choose File'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <span className="text-sm text-gray-500">.txt or .docx files (max 10MB)</span>
          </div>
        </div>

        {/* Meeting Title */}
        <div className="mb-6">
          <label htmlFor="meeting-title" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Title (optional):
          </label>
          <input
            id="meeting-title"
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="e.g., Staff Planning Meeting"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isUploading}
          size="lg"
          className="w-full sm:w-auto"
        >
          <FileText className="w-5 h-5 mr-2" />
          Process Transcript
        </Button>

        {/* Help Text */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Paste or upload your meeting transcript</li>
            <li>AI will generate a summary and extract action items</li>
            <li>Review and approve tasks to add to your list</li>
            <li>Tasks will automatically check for duplicates</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
