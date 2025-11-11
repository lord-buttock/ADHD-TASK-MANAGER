import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface QuickNoteProps {
  onProcess: (note: string) => Promise<void>
}

export function QuickNote({ onProcess }: QuickNoteProps) {
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-save to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quick-note-draft')
    if (saved) {
      setNote(saved)
    }
  }, [])

  useEffect(() => {
    if (note) {
      localStorage.setItem('quick-note-draft', note)
    } else {
      localStorage.removeItem('quick-note-draft')
    }
  }, [note])

  const handleProcess = async () => {
    if (!note.trim()) return

    setError(null)
    setProcessing(true)

    try {
      await onProcess(note)
      setNote('') // Clear on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process note')
    } finally {
      // Always reset processing state
      setProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to process
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleProcess()
    }
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-bold text-purple-900">Quick Capture</h2>
      </div>

      <p className="text-sm text-purple-700 mb-4">
        Write what you need to do in plain English. AI will handle the rest!
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Examples:
• Email parents by Friday about field trip
• Prep lesson on photosynthesis, need 30 mins
• Call mum this weekend, check in about her health
• Make ADE application video"
        className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-base"
        rows={6}
        disabled={processing}
      />

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-purple-600">
          💡 Tip: Cmd/Ctrl + Enter to process quickly
        </p>
        <Button
          onClick={handleProcess}
          disabled={!note.trim() || processing}
          className="flex items-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Process with AI
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-purple-600 font-medium mb-2">What AI does for you:</p>
        <ul className="text-xs text-purple-600 space-y-1">
          <li>✨ Finds related existing tasks and offers to merge</li>
          <li>🎯 Automatically sets urgent/important</li>
          <li>📋 Categorizes by area (work, personal, health, social)</li>
          <li>⏱️ Estimates realistic time needed</li>
          <li>📅 Parses due dates ("Friday", "tomorrow", etc.)</li>
        </ul>
      </div>
    </div>
  )
}
