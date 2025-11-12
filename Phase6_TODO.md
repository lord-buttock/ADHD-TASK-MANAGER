# Phase 6 - Remaining Tasks

## ✅ Completed:
- ✅ Installed recharts library for data visualizations
- ✅ Created comprehensive mood service (src/services/moodService.ts)
  - Mood logging with validation (1-5 scale)
  - Rate limiting (20 logs per day)
  - Get mood logs by date range
  - Calculate mood logging streaks
  - Calculate averages and trends
  - Compare periods for trend analysis
- ✅ Database integration with existing mood_logs table

## 🔲 Still To Do:

### 1. React Query Hooks (src/hooks/useMoodLogs.ts)
```typescript
- useMoodLogs(userId, days) - Fetch mood logs for period
- useLogMood() - Mutation for logging mood
- useLatestMoodLog(userId) - Get most recent log
- useMoodStreak(userId) - Calculate logging streak
- useMoodAverages(userId, days) - Get averages
- useMoodTrends(userId, days) - Get trend comparisons
```

### 2. MoodLogger Component (src/components/MoodLogger.tsx)
**Features:**
- Three slider inputs with live emoji/icon feedback:
  - Mood (1-5): 😢 → 😕 → 😐 → 🙂 → 😄
  - Energy (1-5): 🪫 → 🔋 → ⚡
  - Stress (1-5): 😌 → 😰 with color gradient (green to red)
- Optional notes textarea (max 500 chars with counter)
- Large "Log Current State" primary button
- Display last logged entry ("Last logged: 2 hours ago")
- Show logging streak ("🔥 Logged X days in a row")
- Success animation and toast on submit
- Collapsible on Insights page

### 3. Chart Components (src/components/charts/)

**MoodTrendsChart.tsx** - Line chart showing mood/energy/stress over time
- Uses recharts LineChart
- Three colored lines (mood=blue, energy=green, stress=red)
- Interactive tooltips
- Shows averages below chart
- Trend indicators (improving/declining)
- Empty state with encouragement

**ProductivityByHourChart.tsx** - Bar chart of task completions by hour
- Uses recharts BarChart
- Stacked bars (urgent+important, important, other)
- Shows peak productivity hours
- Recommendations based on patterns
- Empty state

**CompletionByDayChart.tsx** - Bar chart of tasks by day of week
- Uses recharts BarChart
- Color-coded bars (high=green, medium=blue, low=red)
- Shows best/worst days
- Pattern insights (weekday vs weekend)
- Empty state

**HabitSuccessRates.tsx** - Progress bars for habit completion
- Percentage display for each active habit
- Color-coded (90-100%=green, 70-89%=blue, 50-69%=orange, <50%=red)
- Shows completions (e.g., "26/30 days")
- Current streak display
- Overall completion rate
- Empty state

### 4. Insights Service (src/services/insightsService.ts)
```typescript
Functions needed:
- getProductivityByHour(userId, days) - Task completions by hour
- getCompletionByDay(userId, days) - Tasks by day of week
- getHabitSuccessRates(userId, days) - Habit completion percentages
- getCorrelationInsights(userId, days) - Mood vs productivity patterns
```

### 5. Update Insights View (src/views/Insights.tsx)
**Layout:**
- Collapsible MoodLogger at top
- Time period selector tabs (7 / 30 / 90 days)
- Grid layout for charts (2 columns desktop, 1 mobile)
- All charts with proper spacing
- Loading states (skeleton screens)
- Empty states when no data
- Responsive design

**Additional features:**
- Pattern detection display (correlations between mood and productivity)
- Store time period selection in localStorage
- Auto-refresh charts when period changes

### 6. Testing & Polish
- [ ] Test mood logging flow
- [ ] Verify streak calculations
- [ ] Test all charts with real data
- [ ] Test empty states
- [ ] Test time period switching
- [ ] Mobile responsive testing
- [ ] Accessibility (keyboard nav, screen readers)
- [ ] Color blind friendly palettes

## Notes:
- All database tables already exist from Phase 1
- Recharts library already installed
- Focus on ADHD-friendly design: clear visuals, quick to scan, actionable insights
- Keep insights simple and encouraging (not overwhelming)
