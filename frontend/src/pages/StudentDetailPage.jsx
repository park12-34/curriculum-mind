import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getStudent, getStudentHistory, analyzePattern } from '../api/client'
import Spinner from '../components/Spinner'

function calcAge(birthDate) {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const SUBJECT_COLORS = {
  '국어': '#ef4444',
  '영어': '#3b82f6',
  '수학': '#10b981',
  '과학': '#f59e0b',
  '사회': '#8b5cf6',
  '기타': '#6b7280',
}

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [pattern, setPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patternLoading, setPatternLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [studentRes, historyRes] = await Promise.all([
        getStudent(id),
        getStudentHistory(id),
      ])
      setStudent(studentRes.data)
      setHistory(historyRes.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadPattern() {
    setPatternLoading(true)
    try {
      const res = await analyzePattern(id)
      setPattern(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setPatternLoading(false)
    }
  }

  if (loading) return <Spinner label="학생 정보를 불러오는 중..." />
  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>
        <button onClick={() => navigate('/students')} className="text-[var(--color-gold)] hover:underline text-sm font-medium">
          &larr; 학생 목록으로
        </button>
      </div>
    )
  }
  if (!student) return null

  const subjects = student.subjects || []

  const subjectScores = {}
  for (const h of history) {
    for (const subj of subjects) {
      if (h.test_title && h.test_title.includes(subj)) {
        if (!subjectScores[subj]) subjectScores[subj] = []
        subjectScores[subj].push(Number(h.accuracy) || 0)
      }
    }
  }

  const radarData = subjects.map((subj) => {
    const scores = subjectScores[subj]
    const avg = scores && scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
    return { subject: subj, score: avg, fullMark: 100 }
  })

  const now = new Date()
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const recentHistory = history
    .filter((h) => {
      if (!h.test_date) return true
      return new Date(h.test_date) >= oneMonthAgo
    })
    .slice()
    .sort((a, b) => (a.test_date || '').localeCompare(b.test_date || ''))

  const lineDataMap = {}
  for (const h of recentHistory) {
    const label = h.test_date || h.test_title
    if (!lineDataMap[label]) lineDataMap[label] = { name: label }
    for (const subj of subjects) {
      if (h.test_title && h.test_title.includes(subj)) {
        lineDataMap[label][subj] = Number(h.accuracy) || 0
      }
    }
    const matched = subjects.some((s) => h.test_title && h.test_title.includes(s))
    if (!matched) {
      lineDataMap[label]['전체'] = Number(h.accuracy) || 0
    }
  }
  const lineData = Object.values(lineDataMap)
  const lineSubjects = subjects.length > 0 ? subjects : ['전체']

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/students')} className="text-[var(--color-gold)] hover:underline text-sm font-medium">
        &larr; 학생 목록으로
      </button>

      {/* Student info card */}
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">{student.name}</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {student.birth_date && (
                <div>
                  <span className="text-gray-500">나이: </span>
                  <span className="text-[var(--color-navy)] font-medium">{calcAge(student.birth_date)}세</span>
                  <span className="text-gray-400 ml-1">({student.birth_date})</span>
                </div>
              )}
              {student.school_name && (
                <div>
                  <span className="text-gray-500">학교: </span>
                  <span className="text-[var(--color-navy)] font-medium">{student.school_name}</span>
                </div>
              )}
              {student.enrolled_at && (
                <div>
                  <span className="text-gray-500">첫 등원일: </span>
                  <span className="text-[var(--color-navy)] font-medium">{student.enrolled_at}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">등하원: </span>
                {student.is_attending ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">이용</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">미이용</span>
                )}
              </div>
            </div>
            {subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <span key={s} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface)] text-[var(--color-navy)] border border-[var(--color-card-border)]">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Radar chart */}
      {subjects.length >= 3 && (
        <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
          <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">과목별 평균 성적</h3>
          {radarData.every((d) => d.score === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">시험 데이터가 없습니다. 시험을 등록하면 그래프가 표시됩니다.</p>
          ) : (
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E8ECF1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#0F172A' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Radar name="평균 점수" dataKey="score" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Line chart */}
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">최근 1달 성적 추이</h3>
        {lineData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">최근 시험 데이터가 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF1" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {lineSubjects.map((subj) => (
                <Line
                  key={subj}
                  type="monotone"
                  dataKey={subj}
                  stroke={SUBJECT_COLORS[subj] || '#6b7280'}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI pattern analysis */}
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">AI 취약 개념 분석</h3>
          {!pattern && !patternLoading && (
            <button
              onClick={loadPattern}
              className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg text-sm font-medium hover:bg-[var(--color-gold-light)]"
            >
              분석 시작
            </button>
          )}
        </div>
        {patternLoading && <Spinner label="AI가 분석 중입니다..." />}
        {pattern && (
          <div className="space-y-4">
            {pattern.weak_concepts && pattern.weak_concepts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">취약 개념</h4>
                <div className="flex flex-wrap gap-2">
                  {pattern.weak_concepts.map((c, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {pattern.root_cause && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">근본 원인</h4>
                <p className="text-sm text-gray-700 bg-[var(--color-surface)] rounded-xl p-3">{pattern.root_cause}</p>
              </div>
            )}
            {pattern.recommendation && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">학습 개선 방안</h4>
                <p className="text-sm text-gray-700 bg-[var(--color-table-hover)] rounded-xl p-3">{pattern.recommendation}</p>
              </div>
            )}
          </div>
        )}
        {!pattern && !patternLoading && (
          <p className="text-sm text-gray-400">"분석 시작" 버튼을 눌러 AI 분석을 실행하세요.</p>
        )}
      </div>
    </div>
  )
}
