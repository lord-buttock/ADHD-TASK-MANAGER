# Claude Code Build Prompt - ADHD Task Manager

Copy and paste this entire prompt into Claude Code in VS Code.

---

# ADHD Task Manager - Full Build Instructions

I need you to help me build a production-ready ADHD task management application. This is a web app specifically designed to help people with ADHD manage tasks, habits, and reduce cognitive load.

## 🎯 Project Overview

**What we're building:**
A comprehensive task management app with AI integration, cloud storage, and ADHD-friendly features that reduce decision paralysis and provide external memory support.

**I have:**
- A React prototype in `prototype.jsx` that demonstrates the core UI and functionality
- Supabase credentials in `.env.local` for database and auth
- An Anthropic API key for Claude AI integration

**Tech stack to use:**
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **AI Integration:** Anthropic Claude API (already in prototype)
- **State Management:** React Context API + React Query for server state
- **Routing:** React Router v6
- **Date/Time:** date-fns library
- **Icons:** lucide-react (already in prototype)
- **Build/Deploy:** Vite for bundling, Vercel for hosting

---

## 📋 IMPORTANT: Work Incrementally

**Please follow this workflow:**

1. **First, create a comprehensive plan** before writing any code
   - Break down the entire project into logical phases
   - Show me the file structure you'll create
   - Explain the database schema
   - Don't start coding until I approve the plan

2. **Work phase by phase:**
   - Complete Phase 1 fully before moving to Phase 2
   - After each phase, run tests and verify everything works
   - Commit changes with descriptive messages after each phase

3. **Ask for confirmation** before major architectural decisions

4. **Test incrementally** as you build

---

## 🎨 Core Features to Implement

### Phase 1: Project Setup & Database Schema
**Goal:** Get a working Vite + React + Supabase project with authentication

**Tasks:**
1. Initialize Vite project with React + TypeScript template
2. Install and configure:
   - Tailwind CSS
   - React Router
   - Supabase client
   - React Query
   - date-fns
   - lucide-react
3. Set up environment variables correctly
4. Create Supabase database schema with these tables:
   - `users` (handled by Supabase Auth)
   - `tasks` with columns:
     - id (uuid, primary key)
     - user_id (uuid, foreign key to auth.users)
     - title (text, required)
     - notes (text, optional)
     - status (enum: 'todo', 'in-progress', 'done')
     - urgent (boolean)
     - important (boolean)
     - estimated_minutes (integer, optional)
     - area (enum: 'work', 'personal', 'health', 'social')
     - due_date (timestamp, optional)
     - created_at (timestamp)
     - updated_at (timestamp)
     - is_pinned (boolean)
   - `habits` with columns:
     - id (uuid, primary key)
     - user_id (uuid, foreign key)
     - name (text, required)
     - frequency (enum: 'daily', 'weekly')
     - current_streak (integer)
     - record_streak (integer)
     - created_at (timestamp)
   - `habit_completions` with columns:
     - id (uuid, primary key)
     - habit_id (uuid, foreign key)
     - completed_at (date)
   - `quick_notes` with columns:
     - id (uuid, primary key)
     - user_id (uuid, foreign key)
     - content (text)
     - processed (boolean)
     - created_at (timestamp)
   - `mood_logs` with columns:
     - id (uuid, primary key)
     - user_id (uuid, foreign key)
     - mood (integer 1-5)
     - energy (integer 1-5)
     - stress (integer 1-5)
     - notes (text, optional)
     - logged_at (timestamp)

5. Set up Row Level Security (RLS) policies so users can only access their own data
6. Create a simple authentication flow (sign up, log in, log out)
7. Test: Can I sign up, log in, and see an empty dashboard?

**Deliverable:** A working app with authentication where I can log in

---

### Phase 2: Core Task Management
**Goal:** Implement the main task CRUD operations with Eisenhower Matrix

**Tasks:**
1. Create React Context for task management
2. Implement React Query hooks for:
   - Fetching tasks
   - Creating tasks
   - Updating tasks (status, urgency, importance)
   - Deleting tasks
3. Build the task list UI:
   - Display tasks grouped by status (todo, in-progress, done)
   - Show Eisenhower quadrant for each task
   - Colour-coded based on urgency/importance
   - Quick status toggle (todo → in-progress → done)
   - Delete button with confirmation
4. Add task creation form with fields:
   - Title (required)
   - Urgent checkbox
   - Important checkbox
   - Estimated time
   - Area selector
5. Implement automatic prioritisation:
   - Calculate "next task" based on urgent + important
   - Highlight the recommended next task
6. Add WIP (Work in Progress) limit warning
   - Show alert when more than 3 tasks are in-progress
7. Implement task filtering:
   - By area (work/personal/health/social)
   - By status
   - Show/hide completed tasks

**Test:** Can I create, update, delete tasks? Does the Eisenhower Matrix work correctly? Does the "next task" recommendation make sense?

**Deliverable:** Fully functional task management with automatic prioritisation

---

### Phase 3: AI-Powered Task Creation (PRIMARY INTERFACE)
**Goal:** Make AI the main way to create tasks - zero manual categorisation required

**CRITICAL: This is the core ADHD-friendly feature. The user should NEVER have to manually check urgent/important boxes or select areas. AI does ALL categorisation.**

**Tasks:**
1. Create Quick Note component (always visible, prominent)
2. Implement auto-save to Supabase (debounced after user stops typing)
3. Make Quick Note the PRIMARY task creation method:
   - Larger, more prominent than manual "Add Task" button
   - Clear instruction: "Write what you need to do in plain English"
   - Examples: "Email parents by Friday, prep lesson, call mum"
4. Create AI processing function that extracts:
   - Individual tasks from freeform text
   - Urgency (based on deadlines, keywords like "ASAP", "urgent", "soon")
   - Importance (based on impact, consequences, value)
   - Area (work, personal, health, social based on context)
   - Time estimation (realistic based on task type)
   - Due dates (if mentioned: "by Friday", "tomorrow")
5. AI Processing prompt should:
   - Be specifically trained on ADHD-friendly categorisation
   - Explain its reasoning briefly
   - Err on the side of marking things less urgent (reduce overwhelm)
   - Recognize work-related keywords (students, teaching, lesson, etc.)
6. Show AI-created tasks in a review modal:
   - "I created 4 tasks from your note:"
   - List each with its categorisation
   - Allow quick edits before saving
   - "Accept All" button (default)
7. Manual "Add Task" form should be:
   - Still available (for power users)
   - Secondary / less prominent
   - Quick access via keyboard shortcut only
8. Handle errors gracefully (API failures, malformed responses)
9. Add loading states with encouraging messages
10. Clear note after successful processing

**Test:** Can I write freeform notes and have ALL aspects automatically categorised correctly? Does it understand teaching/work context? Does it reduce my cognitive load to zero?

**Deliverable:** AI-first task creation that requires zero manual categorisation

---

### Phase 4: Habits & Streaks
**Goal:** Implement habit tracking with visual streaks

**Tasks:**
1. Create habit CRUD operations
2. Build habit list UI showing:
   - Habit name
   - Current streak (with flame icon)
   - Record streak (with star icon)
   - "Complete" button
3. Implement streak logic:
   - Increment streak on completion
   - Update record if current streak exceeds it
   - Prevent duplicate completions on same day
   - Visual feedback on completion
4. Add habit creation form:
   - Name (required)
   - Frequency (daily/weekly)
5. Show completion history
6. Add visual streak animations (satisfying dopamine hit!)

**Test:** Can I create habits and complete them? Do streaks increment correctly? Can I see my completion history?

**Deliverable:** Full habit tracking system with streaks

---

### Phase 5: Views & Navigation
**Goal:** Create the different app views and navigation

**Tasks:**
1. Set up React Router with routes:
   - `/` → Today's Focus view
   - `/tasks` → All Tasks view
   - `/habits` → Habits view
   - `/calendar` → Calendar view (placeholder for now)
   - `/insights` → Mood/Energy tracking
   - `/settings` → User settings
2. Build navigation component with:
   - Active route highlighting
   - Mobile-responsive hamburger menu
   - Quick stats (tasks completed today, active habits)
3. Implement "Today's Focus" view:
   - Prominent "Next Task" card
   - AI suggestion for what to work on
   - In-progress tasks section
   - Quick access to habits due today
4. Implement "All Tasks" view:
   - Tasks organised by status
   - Filters and sorting options
   - Bulk actions (mark multiple as done)
5. Polish the habits view
6. Create placeholder calendar view

**Test:** Can I navigate between views? Does each view show appropriate content?

**Deliverable:** Fully navigable app with multiple views

---

### Phase 6: Mood & Insights
**Goal:** Add mood/energy tracking and basic insights

**Tasks:**
1. Create mood logging interface:
   - Simple 1-5 sliders for mood, energy, stress
   - Optional notes field
   - One-click "Log Current State" button
2. Build insights dashboard showing:
   - Mood/energy/stress trends over time (simple line chart)
   - Best productive times (when you complete most tasks)
   - Habit completion rates
   - Task completion patterns
3. Store mood logs in Supabase
4. Create basic data visualisation using recharts library

**Test:** Can I log my mood? Do I see helpful insights about my patterns?

**Deliverable:** Mood tracking and insights dashboard

---

### Phase 7: Polish & UX Refinements
**Goal:** Make the app feel professional and delightful to use

**Tasks:**
1. Add loading skeletons for all data fetching
2. Implement optimistic updates (tasks appear instantly before server confirms)
3. Add success/error toast notifications
4. Create empty states with helpful messaging
5. Add keyboard shortcuts:
   - `N` → New task
   - `Q` → Focus Quick Note
   - `/` → Command palette (search tasks)
6. Implement smooth animations:
   - Task status changes
   - Habit completions
   - Page transitions
7. Add dark mode support (check system preference)
8. Ensure full mobile responsiveness
9. Add proper loading states for AI operations
10. Error boundaries for graceful error handling

**Test:** Does the app feel smooth and professional? Are there any jarring moments?

**Deliverable:** Polished, production-ready app

---

### Phase 8: PWA & Offline Support
**Goal:** Make the app installable and work offline

**Tasks:**
1. Create PWA manifest file with:
   - App name, description
   - Icons (generate from a single source image)
   - Theme colours
   - Display mode (standalone)
2. Set up service worker for:
   - Offline functionality
   - Caching strategies
   - Background sync for task updates
3. Add install prompt for users
4. Test offline functionality:
   - Can create/edit tasks offline
   - Changes sync when back online
5. Add "offline mode" indicator

**Test:** Can I install the app on my phone? Does it work without internet?

**Deliverable:** Installable PWA with offline support

---

## 🚨 Critical Requirements

**ADHD-Friendly Design Principles:**
1. **Reduce cognitive load:**
   - Show only actionable items by default
   - Use colour coding for instant recognition
   - Minimise decision points
   
2. **External memory support:**
   - Auto-save everything
   - Quick capture is frictionless
   - Nothing gets lost
   
3. **Prevent overwhelm:**
   - WIP limits
   - Hide non-actionable tasks
   - One clear "next action"
   
4. **Immediate feedback:**
   - Optimistic updates
   - Satisfying animations
   - Clear progress indicators

**Technical Requirements:**
1. **Security:**
   - All queries must use RLS (Row Level Security)
   - Never expose API keys in client code
   - Validate all inputs
   
2. **Performance:**
   - Initial load < 3 seconds
   - Optimistic updates for instant feel
   - Lazy load routes
   
3. **Accessibility:**
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation
   - Screen reader friendly

**Code Quality:**
1. Use TypeScript for type safety
2. Write clean, commented code
3. Follow React best practices (hooks rules, component composition)
4. Handle all error cases
5. Add loading states everywhere

---

## 🧪 Testing Strategy

After each phase:
1. **Manual testing:** I'll test the feature you just built
2. **Ask these questions:**
   - What could go wrong?
   - What edge cases exist?
   - Is error handling robust?
3. **Fix issues** before moving to next phase

---

## 📝 Git Workflow

After completing each phase:
1. Run `git add .`
2. Run `git commit -m "Phase X: [Brief description]"`
3. Tag major milestones: `git tag v0.1.0`

---

## 🚀 Getting Started

**Your first task:**

Please create a comprehensive plan addressing:
1. **Project structure:** Show me the complete folder/file structure
2. **Database schema:** Confirm the Supabase tables look correct
3. **Phase breakdown:** Any adjustments to the phases I've outlined?
4. **Technical decisions:** Any concerns or recommendations?
5. **Estimated timeline:** How long will each phase take?

**After I approve your plan, we'll proceed with Phase 1.**

---

## 💡 Notes for Claude

- **Ask questions** if anything is unclear
- **Suggest improvements** if you see better approaches  
- **Tell me** if I need to make external changes (like updating Supabase settings)
- **Stop and check** before making major architectural changes
- **Prioritise working code** over perfect code - we can refactor later

Let's build something amazing! 🚀