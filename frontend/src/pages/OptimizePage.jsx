import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { optimizeCurriculum } from '../api/client'
import Spinner from '../components/Spinner'

const METHOD_COLOR = {
  '강의': '#3b82f6',
  '실습': '#22c55e',
  '토론': '#f59e0b',
  '프로젝트': '#8b5cf6',
  '강의 및 실습': '#06b6d4',
  '실습 및 토론': '#10b981',
}

const SAMPLE_GAPS = [
  { topic: '데이터 전처리', taught_level: '중', assessed_level: '상', gap_description: '기초만 다룸' },
  { topic: '모델 평가 지표', taught_level: '하', assessed_level: '상', gap_description: '평가 지표 심층 이해 필요' },
  { topic: '신경망 기초', taught_level: '없음', assessed_level: '중', gap_description: '커리큘럼에 없음' },
  { topic: '분류 알고리즘', taught_level: '중', assessed_level: '중', gap_description: '앙상블 보충 필요' },
  { topic: '특성 공학', taught_level: '하', assessed_level: '중', gap_description: '특성 선택/추출 부족' },
]

export default function OptimizePage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalHours, setTotalHours] = useState(16)
  const [coverageScore, setCoverageScore] = useState(52)

  async function handleOptimize() {
    setLoading(true)
    setError(null)
    try {
      const res = await optimizeCurriculum(SAMPLE_GAPS, coverageScore, totalHours, ['모델 평가 지표', '신경망 기초'])
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const hoursChart = result?.sessions?.map((s) => ({
    name: s.topic,
    hours: s.hours,
    method: s.teaching_method,
  })) || []

  const methodCounts = result?.sessions?.reduce((acc, s) => {
    const m = s.teaching_method
    acc[m] = (acc[m] || 0) + s.hours
    return acc
  }, {})
  const pieData = methodCounts
    ? Object.entries(methodCounts).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Curriculum Optimizer</h2>
        <p className="text-gray-500 mt-1">갭 분석 결과를 바탕으로 최적화된 수업 계획을 생성합니다.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm text-gray-500">
              커버리지:
              <input
                type="number"
                value={coverageScore}
                onChange={(e) => setCoverageScore(Number(e.target.value))}
                min={0}
                max={100}
                className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900"
              />
              %
            </label>
            <label className="text-sm text-gray-500">
              총 수업 시간:
              <input
                type="number"
                value={totalHours}
                onChange={(e) => setTotalHours(Number(e.target.value))}
                min={1}
                max={100}
                className="ml-2 w-16 px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900"
              />
              시간
            </label>
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" label="최적화 중..." /> : '커리큘럼 최적화'}
          </button>
        </div>

        <div className="space-y-2">
          {SAMPLE_GAPS.map((g, i) => (
            <div key={i} className="flex items-center gap-3 text-sm px-3 py-2 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-800 w-32">{g.topic}</span>
              <span className="text-gray-500">교육: {g.taught_level}</span>
              <span className="text-gray-400">→</span>
              <span className="text-gray-500">평가: {g.assessed_level}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">세션 수</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{result.sessions?.length || 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">예상 커버리지</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{result.estimated_improvement}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">중점 영역</p>
              <p className="text-lg font-semibold text-blue-600 mt-1">{result.focus_areas?.join(', ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">세션별 시간 배분</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hoursChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" unit="h" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {hoursChart.map((entry, i) => (
                      <Cell key={i} fill={METHOD_COLOR[entry.method] || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">교수법 비율</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} ${value}h`}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={METHOD_COLOR[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">수업 계획 상세</h3>
            <div className="space-y-4">
              {result.sessions?.map((s) => (
                <div key={s.session_number} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      Session {s.session_number}: {s.topic}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: METHOD_COLOR[s.teaching_method] || '#6b7280' }}
                      >
                        {s.teaching_method}
                      </span>
                      <span className="text-sm text-gray-500">{s.hours}시간</span>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {s.objectives.map((obj, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">&#x2022;</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
