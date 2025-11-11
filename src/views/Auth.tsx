import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'
import { SignUpForm } from '../components/auth/SignUpForm'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🔐 Auth view - user state:', { user: !!user, loading })
    if (!loading && user) {
      console.log('🔐 User authenticated, redirecting to dashboard...')
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full">
        {mode === 'login' ? (
          <LoginForm onToggleMode={() => setMode('signup')} />
        ) : (
          <SignUpForm onToggleMode={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
