import confetti from 'canvas-confetti'

/**
 * Trigger confetti celebration
 */
export function triggerConfetti(options: {
  origin?: { x: number; y: number }
  particleCount?: number
  spread?: number
  colors?: string[]
  shapes?: ('circle' | 'square')[]
}) {
  const {
    origin = { x: 0.5, y: 0.5 },
    particleCount = 50,
    spread = 70,
    colors,
    shapes,
  } = options

  confetti({
    particleCount,
    spread,
    origin,
    colors,
    shapes,
    gravity: 1,
    scalar: 1,
  })
}

/**
 * Standard celebration for habit completion
 */
export function celebrateCompletion(elementRect?: DOMRect) {
  const origin = elementRect
    ? {
        x: (elementRect.left + elementRect.width / 2) / window.innerWidth,
        y: (elementRect.top + elementRect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.5 }

  triggerConfetti({
    origin,
    particleCount: 50,
    spread: 70,
    colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
  })

  // Haptic feedback if supported
  if (navigator.vibrate) {
    navigator.vibrate([50, 30, 50])
  }
}

/**
 * Milestone celebration (more intense)
 */
export function celebrateMilestone(streakDay: number, elementRect?: DOMRect) {
  const origin = elementRect
    ? {
        x: (elementRect.left + elementRect.width / 2) / window.innerWidth,
        y: (elementRect.top + elementRect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.5 }

  // Determine celebration intensity based on milestone
  let particleCount = 100
  let colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
  let burstCount = 2

  if (streakDay >= 100) {
    // Legendary celebration
    particleCount = 300
    colors = ['#ffd700', '#ffed4e', '#ff6b6b', '#4ecdc4', '#95e1d3']
    burstCount = 5
  } else if (streakDay >= 30) {
    // 30-day rainbow celebration
    particleCount = 200
    colors = ['#ff6b6b', '#ffa502', '#ffd700', '#4ecdc4', '#3b82f6', '#8b5cf6']
    burstCount = 3
  } else if (streakDay >= 7) {
    // Week celebration
    particleCount = 150
    colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
    burstCount = 2
  }

  // Multiple bursts for big milestones
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      triggerConfetti({
        origin,
        particleCount,
        spread: 90 + i * 20,
        colors,
      })
    }, i * 200)
  }

  // Haptic feedback
  if (navigator.vibrate) {
    if (streakDay >= 30) {
      navigator.vibrate([100, 50, 100, 50, 100])
    } else {
      navigator.vibrate([80, 40, 80])
    }
  }
}

/**
 * Record-breaking celebration (gold confetti)
 */
export function celebrateNewRecord(elementRect?: DOMRect) {
  const origin = elementRect
    ? {
        x: (elementRect.left + elementRect.width / 2) / window.innerWidth,
        y: (elementRect.top + elementRect.height / 2) / window.innerHeight,
      }
    : { x: 0.5, y: 0.5 }

  // Gold confetti shower
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      triggerConfetti({
        origin,
        particleCount: 150,
        spread: 100,
        colors: ['#ffd700', '#ffed4e', '#ffa502', '#ff6348'],
        shapes: ['circle', 'square'],
      })
    }, i * 150)
  }

  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200])
  }
}

/**
 * Get celebration type based on streak day
 */
export function getCelebrationType(
  streakDay: number,
  isNewRecord: boolean
): 'standard' | 'milestone' | 'record' {
  if (isNewRecord) return 'record'
  if ([3, 7, 14, 30, 60, 90, 100, 180, 365].includes(streakDay)) return 'milestone'
  return 'standard'
}

/**
 * Get milestone message
 */
export function getMilestoneMessage(streakDay: number): string | null {
  const milestones: Record<number, string> = {
    3: '3 days! You\'re building the foundation. 🎯',
    7: 'One week strong! The habit loop is forming. 🔥',
    14: 'Two weeks! You\'re past the hardest part. 💪',
    30: '30 days! Your brain has created new neural pathways. This is part of you now. 🌟',
    60: '60 days! Two months of consistency! 🏆',
    90: '90 days! Three months! This is a permanent habit now. 🚀',
    100: '100 DAYS! Legendary status achieved! 👑',
    180: 'Half a year! Absolutely incredible! 🌈',
    365: 'ONE FULL YEAR! You are unstoppable! 🎉',
  }

  return milestones[streakDay] || null
}

/**
 * Check if today is a milestone
 */
export function isMilestone(streakDay: number): boolean {
  return [3, 7, 14, 30, 60, 90, 100, 180, 365].includes(streakDay)
}
