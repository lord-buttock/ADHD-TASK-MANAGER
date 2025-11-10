# Database Setup Instructions

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (URL: https://unfrpejywuxdlhczxsvy.supabase.co)
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Migration

1. Click "New Query" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
2. Open the file `supabase/migrations/001_initial_schema.sql` in this project
3. Copy ALL the contents of that file
4. Paste into the Supabase SQL Editor
5. Click "Run" or press `Ctrl+Enter` / `Cmd+Enter`

## Step 3: Verify Setup

After running the migration, you should see:

- 5 new tables created:
  - `tasks`
  - `habits`
  - `habit_completions`
  - `quick_notes`
  - `mood_logs`

- Multiple indexes created for performance
- Row Level Security (RLS) enabled on all tables
- RLS policies created for user data isolation

## Step 4: Test the Application

1. Make sure the dev server is running: `npm run dev`
2. Open http://localhost:3000
3. You should see the authentication page
4. Try creating an account
5. Check your email for the confirmation link
6. After confirming, sign in
7. You should see the dashboard with "Phase 1 Complete!" message

## Troubleshooting

### "relation already exists"
If you see this error, the tables may already exist. You can either:
- Drop the existing tables first (be careful!)
- Skip to testing the app

### Email not arriving
- Check your spam folder
- In Supabase, go to Authentication > Email Templates to customize
- For development, you can disable email confirmation in Authentication > Settings

### Can't sign in
- Make sure RLS policies are created (Step 2)
- Check the browser console for errors
- Verify environment variables in `.env.local`
