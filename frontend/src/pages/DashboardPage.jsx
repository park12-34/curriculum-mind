import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getClasses, getTestsByClass, getScoresByTest, getStudentsByClass } from '../api/client'
import Spinner from '../components/Spinner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [students, setStudents] = useState([])
  const [tests, setTests] = useState([])
  const [scoresByTest, setScoresByTest] = useState({})

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.data))
      .catch((err) => setError(err.response?.data?.detail || err.message))
  }, [])

  async function handleClassChange(classId) {
    setSelectedClassId(classId)
    setError(null)
    if (!classId) {
      setStudents([])
      setTests([])
      setScoresByTest({})
      return
    }
    setLoading(true)
    try {
      const [studentsRes, testsRes] = await Promise.all([
        getStudentsByClass(classId),
        getTestsByClass(classId),
      ])
      setStudents(studentsRes.data)
      setTests(testsRes.data)

      const scoresMap = {}
      await Promise.all(
        testsRes.data.map(async (t) => {
          const res = await getScoresByTest(t.id)
          scoresMap[t.id] = res.data
        })
      )
      setScoresByTest(scoresMap)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── 통계 계산 ──────────────────────────────────────────
  const totalStudents = students.length

  // 시험별 학생 정답률 계산
  function getStudentAccuracyByTest(testId, studentId, totalQ) {
    const scores = (scoresByTest[testId] || []).filter((s) => s.student_id === studentId)
    if (scores.length === 0) return null
    const correct = scores.filter((s) => s.is_correct).length
    return correct / totalQ
  }

  // 반 평균 정답률
  let classAvgRate = 0
  if (tests.length > 0 && students.length > 0) {
    let totalRate = 0
    let count = 0
    for (const t of tests) {
      for (const s of students) {
        const rate = getStudentAccuracyByTest(t.id, s.id, t.total_questions)
        if (rate !== null) {
          totalRate += rate
          count++
        }
      }
    }
    classAvgRate = count > 0 ? totalRate / count : 0
  }

  // 최근 시험 기준 학생 분류
  const latestTest = tests.length > 0 ? tests[0] : null
  const atRiskStudents = []   // < 60%
  const cautionStudents = []  // 60~75%
  const excellentStudents = [] // >= 90%
  if (latestTest) {
    for (const s of students) {
      const rate = getStudentAccuracyByTest(latestTest.id, s.id, latestTest.total_questions)
      if (rate === null) continue
      const entry = { ...s, accuracy: rate }
      if (rate < 0.6) atRiskStudents.push(entry)
      else if (rate < 0.75) cautionStudents.push(entry)
      else if (rate >= 0.9) excellentStudents.push(entry)
    }
    atRiskStudents.sort((a, b) => a.accuracy - b.accuracy)
    cautionStudents.sort((a, b) => a.accuracy - b.accuracy)
    excellentStudents.sort((a, b) => b.accuracy - a.accuracy)
  }

  // 이번 주 시험 수
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const thisWeekTests = tests.filter((t) => {
    if (!t.test_date) return false
    return new Date(t.test_date) >= weekStart
  }).length

  // 문항별 오답률 히트맵 (최근 시험)
  const heatmapData = []
  if (latestTest && students.length > 0) {
    const scores = scoresByTest[latestTest.id] || []
    for (let q = 1; q <= latestTest.total_questions; q++) {
      const qScores = scores.filter((s) => s.question_no === q)
      const total = qScores.length
      const wrong = total > 0 ? qScores.filter((s) => !s.is_correct).length : 0
      const rate = total > 0 ? wrong / total : 0
      heatmapData.push({ question: q, wrongRate: rate })
    }
  }

  // 반 전체 성적 추이 (시험별 평균)
  const trendData = [...tests].reverse().map((t) => {
    const scores = scoresByTest[t.id] || []
    const byStudent = {}
    for (const s of scores) {
      if (!byStudent[s.student_id]) byStudent[s.student_id] = { correct: 0, total: 0 }
      byStudent[s.student_id].total++
      if (s.is_correct) byStudent[s.student_id].correct++
    }
    const rates = Object.values(byStudent).map((v) => (v.total > 0 ? (v.correct / v.total) * 100 : 0))
    const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
    return { name: t.title, avg: Math.round(avg * 10) / 10 }
  })

  function getHeatColor(rate) {
    const r = Math.round(255 * rate)
    const g = Math.round(255 * (1 - rate * 0.7))
    const b = Math.round(255 * (1 - rate * 0.7))
    return `rgb(${r}, ${g}, ${b})`
  }

  const statCards = [
    { label: '전체 학생 수', value: totalStudents, unit: '명', color: 'var(--color-navy)' },
    { label: '반 평균 정답률', value: `${Math.round(classAvgRate * 100)}`, unit: '%', color: 'var(--color-gold)' },
    { label: '위험 학생 수', value: atRiskStudents.length, unit: '명', color: '#EF4444' },
    { label: '이번 주 시험', value: thisWeekTests, unit: '개', color: '#8B5CF6' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">대시보드</h2>
          <p className="text-gray-500 mt-1">반별 학습 현황을 한눈에 확인합니다.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="print-hide px-4 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-navy-light)] transition-colors"
        >
          리포트 출력
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}

      {/* 반 선택 */}
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">반 선택</label>
        <select
          value={selectedClassId}
          onChange={(e) => handleClassChange(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
        >
          <option value="">-- 반을 선택하세요 --</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && <Spinner label="불러오는 중..." />}

      {selectedClassId && !loading && (
        <>
          {/* 위험 학생 경고 배너 */}
          {atRiskStudents.length > 0 && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span className="text-sm font-semibold">
                {atRiskStudents.length}명의 학생이 즉시 개입이 필요합니다
              </span>
            </div>
          )}

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-[var(--color-card-border)] p-5">
                <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.color }}>
                  {card.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">{card.unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* 문항별 오답률 히트맵 */}
          {heatmapData.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-1">
                문항별 오답률
              </h3>
              <p className="text-xs text-gray-400 mb-4">최근 시험: {latestTest.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {heatmapData.map((d) => (
                  <div
                    key={d.question}
                    title={`${d.question}번 문항: 오답률 ${Math.round(d.wrongRate * 100)}%`}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium cursor-default transition-transform hover:scale-110"
                    style={{
                      backgroundColor: getHeatColor(d.wrongRate),
                      color: d.wrongRate > 0.5 ? '#fff' : '#374151',
                    }}
                  >
                    {d.question}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                <span>0%</span>
                <div className="flex-1 h-2 rounded-full" style={{
                  background: 'linear-gradient(to right, rgb(255,255,255), rgb(255,76,76))',
                  border: '1px solid #e5e7eb',
                }} />
                <span>100%</span>
              </div>
            </div>
          )}

          {/* 학생 현황 목록 */}
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">
              학생 현황
              {latestTest && <span className="text-xs text-gray-400 font-normal ml-2">최근 시험 기준</span>}
            </h3>
            {!latestTest ? (
              <p className="text-sm text-gray-400">시험 데이터가 없습니다.</p>
            ) : (atRiskStudents.length === 0 && cautionStudents.length === 0 && excellentStudents.length === 0) ? (
              <p className="text-sm text-gray-400">해당하는 학생이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {atRiskStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-red-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                        즉시 개입 필요
                      </span>
                      <span className="text-sm font-medium text-[var(--color-navy)]">{s.name}</span>
                      <span className="text-sm text-gray-400">
                        정답률 {Math.round(s.accuracy * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-navy)] text-white rounded-lg hover:bg-[var(--color-navy-light)] transition-colors"
                    >
                      AI 분석
                    </button>
                  </div>
                ))}
                {cautionStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-yellow-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                        주의 관찰
                      </span>
                      <span className="text-sm font-medium text-[var(--color-navy)]">{s.name}</span>
                      <span className="text-sm text-gray-400">
                        정답률 {Math.round(s.accuracy * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-navy)] text-white rounded-lg hover:bg-[var(--color-navy-light)] transition-colors"
                    >
                      AI 분석
                    </button>
                  </div>
                ))}
                {excellentStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-green-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-block px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        우수
                      </span>
                      <span className="text-sm font-medium text-[var(--color-navy)]">{s.name}</span>
                      <span className="text-sm text-gray-400">
                        정답률 {Math.round(s.accuracy * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/students/${s.id}`)}
                      className="px-3 py-1.5 text-xs font-medium bg-[var(--color-navy)] text-white rounded-lg hover:bg-[var(--color-navy-light)] transition-colors"
                    >
                      AI 분석
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 반 전체 성적 추이 */}
          {trendData.length > 0 && (
            <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">반 전체 성적 추이</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
                    formatter={(value) => [`${value}%`, '반 평균']}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="var(--color-navy)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-gold)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
