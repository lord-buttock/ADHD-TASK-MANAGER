import Anthropic from '@anthropic-ai/sdk'
import type { Task } from '../types/task.types'
import type { TaskMatch, ParsedTask } from '../types/task.types'

// Debug: Log the API key being used (first/last 10 chars only for security)
const envApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
const hardcodedKey = 'REDACTED_API_KEY'
const apiKey = hardcodedKey // Temporary: using hardcoded key to bypass env issue

console.log('🔑 ENV API Key:', envApiKey ? `${envApiKey.substring(0, 10)}...${envApiKey.substring(envApiKey.length - 10)}` : 'MISSING')
console.log('🔑 Using hardcoded key:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}` : 'MISSING')
console.log('🔑 API Key length:', apiKey?.length)

const anthropic = new Anthropic({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // Note: For production, use a backend proxy
})

const MODEL = 'claude-3-5-haiku-20241022' // Claude 3.5 Haiku - should be widely available

/**
 * Find semantically similar tasks using Claude AI
 * This is the core of the semantic matching feature
 */
export async function findSimilarTasks(
  noteContent: string,
  existingTasks: Task[]
): Promise<TaskMatch[]> {
  if (existingTasks.length === 0) {
    return []
  }

  const prompt = `You're helping someone with ADHD manage their tasks. They just wrote this note:

"${noteContent}"

Here are their existing incomplete tasks:
${existingTasks.map((t, i) => `${i + 1}. "${t.title}"${t.notes ? `\n   Notes: ${t.notes}` : ''}`).join('\n')}

For each existing task, determine if the new note is related to it. Consider:
- Semantic meaning, not just keywords
- Context and intent
- Examples:
  * "application video" relates to "Make ADE video"
  * "Ideas for students' work" relates to "Make ADE application video"
  * "prep lesson" relates to "Friday lesson planning"
  * But "email parents about video" and "prep lesson" are separate topics

Return ONLY a JSON array of matches with similarity scores (0-100). Only include tasks with similarity >= 70.

Format:
[
  {
    "task_index": 0,
    "similarity": 85,
    "reasoning": "Both are about the ADE application video"
  }
]

If no tasks are related, return an empty array: []`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return []
    }

    const matches = JSON.parse(jsonMatch[0])

    // Map matches to TaskMatch objects
    return matches.map((match: any) => ({
      task: existingTasks[match.task_index],
      similarity: match.similarity,
      reasoning: match.reasoning,
    }))
  } catch (error) {
    console.error('Error finding similar tasks:', error)
    return []
  }
}

/**
 * Extract and categorize tasks from freeform text using Claude AI
 * This handles all the manual categorization work
 */
export async function categorizeTasks(noteContent: string): Promise<ParsedTask[]> {
  const prompt = `You're helping someone with ADHD manage tasks. They wrote this note in plain English:

"${noteContent}"

Extract individual tasks and categorize them. Follow these ADHD-friendly rules:

**Urgency:**
- Mark urgent ONLY if: explicit deadline < 48 hours OR words like "ASAP", "urgent", "now", "today"
- Err on the side of LESS urgent to reduce overwhelm
- Examples: "by Friday" (if today is Wed) = urgent, "next week" = not urgent

**Importance:**
- Mark important if: significant consequences, high value, or explicit importance
- Consider long-term impact
- Examples: "job application" = important, "check email" = not important

**Area:**
- work: teaching, students, lesson, school, job, project, meeting
- personal: home, family, errands, general life admin
- health: exercise, doctor, medication, mental health, wellbeing
- social: friends, events, calls, birthdays

**Time Estimation:**
- Be realistic - people with ADHD often underestimate
- Quick tasks: 15-30 min
- Normal tasks: 30-60 min
- Big tasks: 60-120 min

**Due Date Parsing:**
- Parse relative dates: "tomorrow", "Friday", "next week"
- Today is ${new Date().toISOString().split('T')[0]}
- Return ISO format: "2025-11-15T17:00:00Z"

Return ONLY a JSON array:
[
  {
    "title": "Make ADE application video",
    "notes": "Include student work examples, keep under 2 minutes",
    "urgent": true,
    "important": true,
    "area": "work",
    "estimated_minutes": 120,
    "due_date": "2025-11-15T17:00:00Z",
    "reasoning": "Teaching-related with specific deadline makes it urgent and important"
  }
]

Extract ALL tasks from the note, even if there are multiple.`

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Could not parse tasks from AI response')
    }

    const tasks = JSON.parse(jsonMatch[0])
    return tasks
  } catch (error) {
    console.error('Error categorizing tasks:', error)
    throw error
  }
}
