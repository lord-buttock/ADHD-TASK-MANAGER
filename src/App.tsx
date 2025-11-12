import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/Layout'
import { Auth } from './views/Auth'
import { TodayFocus } from './views/TodayFocus'
import { AllTasks } from './views/AllTasks'
import { MeetingRecorder } from './views/MeetingRecorder'
import { MeetingHistory } from './views/MeetingHistory'
import { Habits } from './views/Habits'
import { Insights } from './views/Insights'
import { Settings } from './views/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TodayFocus />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AllTasks />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meeting-recorder"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MeetingRecorder />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meeting-history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MeetingHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Habits />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Insights />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
