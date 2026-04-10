import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getClasses, getStudentsByClass, analyzePattern, analyzeTrajectory, askCoach } from '../api/client'
import Spinner from '../components/Spinner'

const TABS = [
  { key: 'pattern', label: '오답 패턴 분석' },
  { key: 'trajectory', label: '학습 궤적 예측' },
  { key: 'coach', label: 'AI 코치' },
]

const RISK_COLOR = {
  '높음': 'bg-red-100 text-red-800',
  '보통': 'bg-yellow-100 text-yellow-800',
  '낮음': 'bg-green-100 text-green-800',
}

export default function AnalysisPage() {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [tab, setTab] = useState('pattern')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [patternResult, setPatternResult] = useState(null)
  const [trajectoryResult, setTrajectoryResult] = useState(null)

  const [question, setQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    getClasses().then((res) => setClasses(res.data)).catch(() => {})
  }, [])

  async function handleClassChange(classId) {
    setSelectedClassId(classId)
    setSelectedStudentId('')
    setPatternResult(null)
    setTrajectoryResult(null)
    setChatHistory([])
    if (!classId) { setStudents([]); return }
    try {
      const res = await getStudentsByClass(classId)
      setStudents(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleAnalyzePattern() {
    if (!selectedStudentId) return
    setLoading(true)
    setError(null)
    setPatternResult(null)
    try {
      const res = await analyzePattern(selectedStudentId)
      setPatternResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyzeTrajectory() {
    if (!selectedStudentId) return
    setLoading(true)
    setError(null)
    setTrajectoryResult(null)
    try {
      const res = await analyzeTrajectory(selectedStudentId)
      setTrajectoryResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAskCoach(e) {
    e.preventDefault()
    if (!question.trim() || !selectedClassId) return
    const q = question.trim()
    setChatHistory((prev) => [...prev, { role: 'user', content: q }])
    setQuestion('')
    setLoading(true)
    setError(null)
    try {
      const res = await askCoach(q, selectedClassId)
      setChatHistory((prev) => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        dataUsed: res.data.data_used,
      }])
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedStudentName = students.find((s) => s.id === selectedStudentId)?.name || ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">AI 분석</h2>
        <p className="text-gray-500 mt-1">학생별 오답 패턴, 성적 예측, AI 코칭을 제공합니다.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}

      {/* 반 & 학생 선택 */}
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">반 선택</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
            >
              <option value="">-- 반을 선택하세요 --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {tab !== 'coach' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학생 선택</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)] disabled:opacity-50"
              >
                <option value="">-- 학생을 선택하세요 --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-white rounded-2xl border border-[var(--color-card-border)] p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setError(null) }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[var(--color-navy)] text-white' : 'text-[var(--color-navy-light)] hover:bg-[var(--color-table-header)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 탭 1: 오답 패턴 분석 */}
      {tab === 'pattern' && (
        <div className="space-y-4">
          <button
            onClick={handleAnalyzePattern}
            disabled={!selectedStudentId || loading}
            className="px-6 py-2.5 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-medium text-sm hover:bg-[var(--color-gold-light)] disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" label="분석 중..." /> : '오답 패턴 분석'}
          </button>

          {patternResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">취약 개념</h4>
                {patternResult.weak_concepts.length === 0 ? (
                  <p className="text-sm text-gray-400">없음</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {patternResult.weak_concepts.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">근본 원인</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{patternResult.root_cause}</p>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3">추천 학습 방향</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{patternResult.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 학습 궤적 예측 */}
      {tab === 'trajectory' && (
        <div className="space-y-4">
          <button
            onClick={handleAnalyzeTrajectory}
            disabled={!selectedStudentId || loading}
            className="px-6 py-2.5 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-medium text-sm hover:bg-[var(--color-gold-light)] disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" label="예측 중..." /> : '학습 궤적 예측'}
          </button>

          {trajectoryResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 text-center">
                  <p className="text-sm text-gray-500 mb-1">현재 추세</p>
                  <p className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">{trajectoryResult.current_trend}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 text-center">
                  <p className="text-sm text-gray-500 mb-1">위험도</p>
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${RISK_COLOR[trajectoryResult.risk_level] || 'bg-gray-100 text-gray-700'}`}>
                    {trajectoryResult.risk_level}
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 text-center">
                  <p className="text-sm text-gray-500 mb-1">대상 학생</p>
                  <p className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">{selectedStudentName}</p>
                </div>
              </div>

              {trajectoryResult.predicted_scores?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4">예측 점수 추이</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trajectoryResult.predicted_scores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF1" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#C9A84C"
                        strokeWidth={2}
                        dot={{ r: 5, fill: '#C9A84C' }}
                        name="예측 점수"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-[var(--color-table-hover)] border border-[var(--color-card-border)] rounded-2xl p-6">
                <p className="text-sm text-[var(--color-navy)] leading-relaxed">{trajectoryResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 3: AI 코치 */}
      {tab === 'coach' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
            {chatHistory.length === 0 && !loading && (
              <p className="text-sm text-gray-400 text-center py-8">
                반을 선택하고 질문을 입력하세요.<br />
                예: "이번 시험에서 가장 많이 틀린 문항은?" "김철수가 왜 성적이 떨어지고 있어?"
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[var(--color-navy)] text-white'
                    : 'bg-[var(--color-table-header)] text-[var(--color-navy)]'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.dataUsed && (
                    <p className={`text-xs mt-2 pt-2 border-t ${
                      msg.role === 'user' ? 'border-white/20 text-gray-300' : 'border-gray-200 text-gray-400'
                    }`}>
                      근거: {msg.dataUsed}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-table-header)] rounded-2xl px-4 py-3">
                  <Spinner size="sm" label="답변 생성 중..." />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAskCoach} className="flex gap-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="질문을 입력하세요..."
              disabled={!selectedClassId || loading}
              className="flex-1 px-4 py-2.5 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!question.trim() || !selectedClassId || loading}
              className="px-6 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50 shrink-0"
            >
              전송
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
