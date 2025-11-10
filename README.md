# ADHD Task Manager

A production-ready ADHD task management application with AI-powered task creation, semantic task matching, and ADHD-friendly features.

## Setup Instructions

### 1. Install Dependencies

Already done! Dependencies are installed.

### 2. Set Up Supabase Database

1. Go to your Supabase project: https://unfrpejywuxdlhczxsvy.supabase.co
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor

This will create:
- All database tables (tasks, habits, habit_completions, quick_notes, mood_logs)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamps

### 3. Run the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Test Authentication

1. Open http://localhost:3000
2. You'll be redirected to the auth page
3. Create an account with your email
4. Check your email for the confirmation link
5. After confirming, sign in
6. You should see the dashboard!

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Context + TanStack Query
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** Anthropic Claude API
- **Date/Time:** date-fns
- **Icons:** lucide-react

## Project Status

✅ **Phase 1 Complete:** Project Setup & Authentication
- [x] Vite + React + TypeScript setup
- [x] Tailwind CSS configured
- [x] Supabase client integrated
- [x] Database schema created
- [x] Row Level Security policies
- [x] Authentication flow (sign up, sign in, sign out)
- [x] Protected routes

🔜 **Next: Phase 2** - Core Task Management with Eisenhower Matrix

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run lint
```

## Environment Variables

The following environment variables are already configured in `.env.local`:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_ANTHROPIC_API_KEY` - Your Anthropic API key (for Phase 3)
