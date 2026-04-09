import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { predictStruggles } from '../api/client'
import Spinner from '../components/Spinner'

const RISK_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
const RISK_LABEL = { high: '위험', medium: '주의', low: '양호' }

const SAMPLE_DATA = [
  { student_id: 'S001', student_name: '김민수', scores: [85, 78, 72, 68, 61], attendance_rate: 0.92 },
  { student_id: 'S002', student_name: '이서연', scores: [90, 88, 92, 85, 91], attendance_rate: 0.98 },
  { student_id: 'S003', student_name: '박지훈', scores: [65, 58, 52, 45, 38], attendance_rate: 0.85 },
  { student_id: 'S004', student_name: '최유진', scores: [72, 75, 78, 80, 82], attendance_rate: 0.95 },
  { student_id: 'S005', student_name: '정하윤', scores: [45, 42, 38, 35, 30], attendance_rate: 0.62 },
]

export default function PredictPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [jsonInput, setJsonInput] = useState('')

  async function handlePredict(records) {
    setLoading(true)
    setError(null)
    try {
      const res = await predictStruggles(records)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSamplePredict() {
    handlePredict(SAMPLE_DATA)
  }

  function handleJsonPredict() {
    try {
      const parsed = JSON.parse(jsonInput)
      const records = parsed.quiz_records || parsed
      handlePredict(records)
    } catch {
      setError('JSON 형식이 올바르지 않습니다.')
    }
  }

  const chartData = result?.at_risk_students?.map((s) => ({
    name: s.student_name,
    avg: s.avg_score,
    risk: s.risk_level,
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Struggle Predictor</h2>
        <p className="text-gray-500 mt-1">퀴즈 성적 패턴을 분석하여 낙오 위험 학생을 예측합니다.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleSamplePredict}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" label="분석 중..." /> : '샘플 데이터로 테스트'}
          </button>
        </div>

        <details className="group">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            JSON 직접 입력
          </summary>
          <div className="mt-3 space-y-3">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{"student_id":"S001","student_name":"홍길동","scores":[80,70,60],"attendance_rate":0.9}]'
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono"
            />
            <button
              onClick={handleJsonPredict}
              disabled={loading || !jsonInput.trim()}
              className="px-5 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              JSON으로 분석
            </button>
          </div>
        </details>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <p className="text-sm text-gray-500">반 평균</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{result.class_avg}</p>
            </div>
            {Object.entries(result.risk_summary).map(([level, count]) => (
              <div key={level} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                <p className="text-sm text-gray-500">{RISK_LABEL[level]}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: RISK_COLOR[level] }}>{count}명</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학생별 평균 점수</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLOR[entry.risk]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학생 상세</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">학생</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">평균</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">추세</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">위험도</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">위험 요인</th>
                  </tr>
                </thead>
                <tbody>
                  {result.at_risk_students.map((s) => (
                    <tr key={s.student_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{s.student_name}</td>
                      <td className="py-3 px-4">{s.avg_score}</td>
                      <td className="py-3 px-4">
                        <span className={
                          s.trend === 'declining' ? 'text-red-600' :
                          s.trend === 'improving' ? 'text-green-600' : 'text-gray-500'
                        }>
                          {s.trend === 'declining' ? '↓ 하락' : s.trend === 'improving' ? '↑ 상승' : '→ 안정'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: RISK_COLOR[s.risk_level] }}
                        >
                          {RISK_LABEL[s.risk_level]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{s.factors.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
