import { supabase } from '../lib/supabase'
import { callClaudeAPI } from './aiService'

export interface HabitSuggestion {
  improvedName: string
  reasoning: string
  difficulty: number
  difficultyExplanation: string
  easierVersion?: string
  bestTime?: string
  stackWith?: string
  stackSuggestion?: string
  barriers: string[]
  encouragement: string
}

export interface ReformulationSuggestion {
  vague: boolean
  suggestions: Array<{
    habit: string
    explanation: string
  }>
  encouragement: string
}

/**
 * Get AI suggestions for improving a habit
 */
export async function getHabitSuggestions(
  habitName: string,
  userId: string
): Promise<HabitSuggestion> {
  try {
    // Gather user context
    const [tasksResult, habitsResult, completionsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('title, area, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('habits')
        .select('name, current_streak, frequency')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(100),
    ])

    const recentTasks = tasksResult.data || []
    const existingHabits = habitsResult.data || []
    const completions = completionsResult.data || []

    // Analyze best completion times
    const completionByHour: Record<number, number> = {}
    completions.forEach((c) => {
      const hour = new Date(c.completed_at).getHours()
      completionByHour[hour] = (completionByHour[hour] || 0) + 1
    })

    const bestHours = Object.entries(completionByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    const prompt = `User wants to create a habit: "${habitName}"

Context about this user:
- Recent tasks: ${JSON.stringify(recentTasks.slice(0, 10))}
- Existing habits: ${JSON.stringify(existingHabits)}
- Most successful completion times: ${bestHours.join(', ')}

As an ADHD-friendly habit coach, provide:

1. **Improved Version**: Make the habit more specific and actionable
   - Transform vague into clear (e.g., "exercise" → "10-min walk after breakfast")
   - Keep it SMALL (5-10 minutes ideal for ADHD brains)
   - Make it SPECIFIC (no decisions needed when it's time to do it)

2. **Difficulty Assessment**: Rate difficulty 1-10 and explain why
   - Consider duration, specificity, daily vs weekly
   - If difficulty > 7: Suggest easier starting version

3. **Best Time**: Based on their completion patterns, when should they do this?
   - Reference their successful habit times
   - Consider their task patterns

4. **Stacking Opportunity**: Can this stack with an existing habit?
   - Example: "Take vitamins WHILE coffee brews"
   - Reference their successful habits (>80% completion)

5. **Potential Barriers**: What might prevent success?
   - Be specific to their patterns
   - Suggest preemptive solutions

Respond in JSON format:
{
  "improvedName": "specific habit name",
  "reasoning": "why this is better",
  "difficulty": 7,
  "difficultyExplanation": "why this score",
  "easierVersion": "simpler alternative if difficult (or null)",
  "bestTime": "7:00 AM after coffee (or null)",
  "stackWith": "existing habit name or null",
  "stackSuggestion": "Take vitamins while coffee brews (or null)",
  "barriers": ["barrier 1", "barrier 2"],
  "encouragement": "You've got this! Start small and scale up."
}`

    const response = await callClaudeAPI(prompt, { temperature: 0.7 })
    return JSON.parse(response)
  } catch (error) {
    console.error('Error getting habit suggestions:', error)
    // Return fallback suggestion
    return {
      improvedName: habitName,
      reasoning: 'Unable to generate suggestions at this time',
      difficulty: 5,
      difficultyExplanation: 'Medium difficulty',
      barriers: [],
      encouragement: 'Start small and be consistent!',
    }
  }
}

/**
 * Generate encouragement message based on streak progress
 */
export async function generateEncouragement(
  habitName: string,
  streakDay: number,
  context: 'completed' | 'milestone' | 'broken'
): Promise<string> {
  try {
    const prompt = `Habit: "${habitName}"
Current streak: ${streakDay} days
Context: ${context}

Generate an encouraging message for someone with ADHD:

Guidelines:
- Be SPECIFIC to the streak day (reference the number)
- Be AUTHENTIC (not generic cheerleading)
- For milestones (7, 14, 30, 100 days): Explain why it matters
- For breaks: Be COMPASSIONATE (focus on learning, not guilt)
- Keep it SHORT (1-2 sentences)
- Use emoji sparingly (1-2 max)

Examples of GOOD messages:
- Day 3: "3 days in! You're in the critical first week. Keep going!"
- Day 30: "30 days! Your brain has created new neural pathways. This is part of you now."
- Broken after 15: "You made it 15 days! That's not nothing. What needs to change to make this easier?"

Examples of BAD messages:
- "Good job!" (too generic)
- "You can do it! Just believe in yourself!" (empty cheerleading)
- "You failed" or "You should feel bad" (guilt-inducing)

Respond with just the message text, no JSON.`

    return await callClaudeAPI(prompt, { temperature: 0.8 })
  } catch (error) {
    console.error('Error generating encouragement:', error)
    // Return fallback encouragement
    if (context === 'broken') {
      return "Progress isn't always linear. What did you learn?"
    }
    return `${streakDay} ${streakDay === 1 ? 'day' : 'days'}! Keep building momentum.`
  }
}

/**
 * Reformulate vague habits into specific, actionable ones
 */
export async function reformulateVagueHabit(vagueHabit: string): Promise<ReformulationSuggestion> {
  try {
    const prompt = `User typed this habit: "${vagueHabit}"

This might be too vague! Help make it specific and actionable.

Suggest 3-5 concrete versions that:
- Are SPECIFIC (exact action to take)
- Are MEASURABLE (you know if you did it)
- Are SMALL (can do in <10 minutes)
- Require NO DECISIONS (completely clear what to do)

Example transformations:
- "Exercise" → ["10-min walk after breakfast", "5 push-ups when I wake up", "Stretch for 3 minutes at lunch"]
- "Be healthier" → ["Drink water when I sit at desk", "Eat one vegetable with dinner", "Take stairs instead of lift"]
- "Read more" → ["Read 3 pages before bed", "Read one article at lunch", "Read 10 minutes on train"]

Determine if the habit is vague (true) or specific enough (false).

Respond in JSON:
{
  "vague": true,
  "suggestions": [
    {
      "habit": "specific habit name",
      "explanation": "why this works"
    }
  ],
  "encouragement": "Short message about starting small"
}`

    const response = await callClaudeAPI(prompt, { temperature: 0.7 })
    return JSON.parse(response)
  } catch (error) {
    console.error('Error reformulating habit:', error)
    // Return fallback
    return {
      vague: false,
      suggestions: [],
      encouragement: 'Make it as specific as possible!',
    }
  }
}

/**
 * Check if a habit name is vague and needs reformulation
 */
export function isHabitVague(habitName: string): boolean {
  const vagueWords = [
    'exercise',
    'healthy',
    'healthier',
    'better',
    'more',
    'less',
    'improve',
    'work on',
    'try to',
    'be',
  ]
  const lowerName = habitName.toLowerCase()
  return (
    habitName.trim().length < 10 ||
    vagueWords.some((word) => lowerName.includes(word))
  )
}

export const habitAI = {
  getHabitSuggestions,
  generateEncouragement,
  reformulateVagueHabit,
  isHabitVague,
}
