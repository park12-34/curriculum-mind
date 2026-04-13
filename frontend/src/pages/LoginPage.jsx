import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      console.log('Login attempt:', { url: import.meta.env.VITE_SUPABASE_URL, email })
      const response = await axios.post(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          email,
          password,
        },
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('Login response:', response)
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('user_email', response.data.user?.email || email)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.log('Login error:', err.response?.data || err.message)
      const msg = err.response?.data?.error_description || err.response?.data?.msg || '로그인에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4 font-[var(--font-body)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[var(--font-heading)] text-[var(--color-navy)]">CurriculumMind</h1>
          <p className="text-gray-500 mt-2 text-sm">교강사를 위한 AI 학습 분석 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-8">
          <h2 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-6 text-center">로그인</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full px-3 py-2.5 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                required
                className="w-full px-3 py-2.5 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50 transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; 2026 CurriculumMind. All rights reserved.
        </p>
      </div>
    </div>
  )
}
