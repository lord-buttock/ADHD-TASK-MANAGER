import { useState, useRef, useEffect } from 'react'
import { Mic, Pause, Play, Square, X, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'

interface LiveRecorderProps {
  onComplete: (transcript: string, title: string, durationSeconds: number) => void
}

// Extend Window interface for webkit
declare global {
  interface Window {
    webkitSpeechRecognition: any
  }
}

export function LiveRecorder({ onComplete }: LiveRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState('')
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window
    setIsSupported(supported)
  }, [])

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused])

  // Auto-save effect
  useEffect(() => {
    if (isRecording && transcript.length > 0) {
      autoSaveRef.current = setInterval(() => {
        localStorage.setItem('meeting-transcript-draft', transcript)
        localStorage.setItem('meeting-title-draft', meetingTitle)
        setLastAutoSave(new Date())
      }, 30000) // Every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current)
      }
    }
  }, [isRecording, transcript, meetingTitle])

  // Update word count
  useEffect(() => {
    const words = transcript.trim().split(/\s+/).filter((w) => w.length > 0)
    setWordCount(words.length)
  }, [transcript])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      const recognition = new window.webkitSpeechRecognition()

      // Configuration
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-AU'
      recognition.maxAlternatives = 1

      // Event handlers
      recognition.onstart = () => {
        setIsRecording(true)
        setIsPaused(false)
        setError('')
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' '
          } else {
            interimTranscript += transcriptPart
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
        setInterimText(interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        const errorMessages: Record<string, string> = {
          'no-speech': 'No speech detected. Is your microphone on?',
          'audio-capture': 'Cannot access microphone. Please grant permission.',
          'not-allowed': 'Microphone permission denied.',
          network: 'Network error. Check your connection.',
          aborted: 'Recording stopped unexpectedly.',
        }

        setError(errorMessages[event.error] || 'Recording error occurred')
        setIsRecording(false)
      }

      recognition.onend = () => {
        // If not paused or stopped, restart
        if (isRecording && !isPaused) {
          recognition.start()
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (err) {
      setError('Microphone permission denied. Please allow access to continue.')
    }
  }

  const pauseRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsPaused(true)
    }
  }

  const resumeRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsPaused(false)
    }
  }

  const stopAndProcess = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    // Clear auto-save
    localStorage.removeItem('meeting-transcript-draft')
    localStorage.removeItem('meeting-title-draft')

    // Call completion handler
    onComplete(transcript, meetingTitle || `Meeting ${new Date().toLocaleDateString()}`, duration)
  }

  const cancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)
    setTranscript('')
    setInterimText('')
    setDuration(0)
    setWordCount(0)
  }

  if (!isSupported) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                Live Recording Not Supported
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                Live recording requires Chrome or Edge browser. Your current browser doesn't
                support the Web Speech API.
              </p>
              <p className="text-sm text-yellow-800">
                Use the <strong>Import Transcript</strong> tab to paste or upload meeting notes
                from other sources.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isRecording) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <Mic className="w-10 h-10 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Record</h2>
          <p className="text-gray-600 mb-8">
            Click start to begin transcribing your meeting in real-time.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for Best Results:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Keep this browser tab active during recording</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Use on desktop or laptop (works best)</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Record in a quiet environment</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Speak clearly near the microphone</span>
              </li>
            </ul>
          </div>

          <div className="mb-8">
            <label htmlFor="meeting-title" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title (optional)
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

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button onClick={startRecording} size="lg" className="w-full sm:w-auto">
            <Mic className="w-5 h-5 mr-2" />
            Start Recording
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Pause className="w-6 h-6 text-gray-400" />
              ) : (
                <div className="relative">
                  <Mic className="w-6 h-6 text-red-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isPaused ? 'Paused' : 'Recording'}
              </h2>
              <p className="text-sm text-gray-600">{formatDuration(duration)}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600">{wordCount} words</p>
            {lastAutoSave && (
              <p className="text-xs text-gray-500">Auto-saved</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          {isPaused ? (
            <Button onClick={resumeRecording} variant="secondary">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button onClick={pauseRecording} variant="secondary">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          <Button onClick={stopAndProcess} className="bg-green-600 hover:bg-green-700">
            <Square className="w-4 h-4 mr-2" />
            Stop & Process
          </Button>

          <Button onClick={cancelRecording} variant="secondary" className="text-red-600">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Transcript Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Live Transcript:</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            <p className="text-gray-900 whitespace-pre-wrap">
              {transcript}
              {interimText && (
                <span className="text-gray-400 italic">{interimText}</span>
              )}
            </p>
            {!transcript && !interimText && (
              <p className="text-gray-400 italic">Waiting for speech...</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
