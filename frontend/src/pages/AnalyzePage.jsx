import { useState, useEffect, useRef } from 'react'
import { getClasses, getTestsByClass, getScoresByTest, getStudentsByClass } from '../api/client'
import Spinner from '../components/Spinner'
import api from '../api/client'

export default function AnalyzePage() {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [tests, setTests] = useState([])
  const [selectedTestId, setSelectedTestId] = useState('')
  const [students, setStudents] = useState([])
  const [scoresLoaded, setScoresLoaded] = useState(false)
  const [scoresSummary, setScoresSummary] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const fileRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    getClasses().then((res) => setClasses(res.data)).catch(() => {})
  }, [])

  async function handleClassChange(classId) {
    setSelectedClassId(classId)
    setSelectedTestId('')
    setTests([])
    setStudents([])
    setScoresLoaded(false)
    setScoresSummary('')
    setResult(null)
    if (!classId) return
    try {
      const [testsRes, studentsRes] = await Promise.all([
        getTestsByClass(classId),
        getStudentsByClass(classId),
      ])
      setTests(testsRes.data)
      setStudents(studentsRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleTestChange(testId) {
    setSelectedTestId(testId)
    setScoresLoaded(false)
    setScoresSummary('')
    setResult(null)
    if (!testId) return
    try {
      const res = await getScoresByTest(testId)
      const scores = res.data
      if (scores.length === 0) {
        setScoresSummary('O/X 데이터 없음 — 시험 관리에서 먼저 입력하세요.')
      } else {
        const studentCount = new Set(scores.map((s) => s.student_id)).size
        const correct = scores.filter((s) => s.is_correct).length
        setScoresSummary(`${studentCount}명 학생, ${scores.length}개 응답, 평균 정답률 ${Math.round(correct / scores.length * 100)}%`)
        setScoresLoaded(true)
      }
    } catch {
      setScoresSummary('O/X 데이터 로드 실패')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedClassId || !selectedTestId || !pdfFile) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('pdf_file', pdfFile)
      form.append('class_id', selectedClassId)
      form.append('test_id', selectedTestId)
      const { data } = await api.post('/api/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">Learning Gap Analysis</h2>
        <p className="text-gray-500 mt-1">시험지 PDF와 O/X 데이터를 교차 분석하여 학생별 취약점을 진단합니다.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시험 선택</label>
            <select
              value={selectedTestId}
              onChange={(e) => handleTestChange(e.target.value)}
              disabled={!selectedClassId}
              className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)] disabled:opacity-50"
            >
              <option value="">-- 시험을 선택하세요 --</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>{t.title} ({t.total_questions}문항)</option>
              ))}
            </select>
          </div>
        </div>

        {scoresSummary && (
          <div className={`px-4 py-3 rounded-xl text-sm ${
            scoresLoaded ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            {scoresSummary}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시험지 PDF</label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              pdfFile ? 'border-green-300 bg-green-50' : 'border-[var(--color-card-border)] hover:border-[var(--color-gold)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="hidden"
            />
            {pdfFile ? (
              <p className="text-sm text-green-700 font-medium">{pdfFile.name}</p>
            ) : (
              <p className="text-xs text-gray-400">클릭하여 시험지 PDF를 첨부하세요</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !selectedClassId || !selectedTestId || !pdfFile || !scoresLoaded}
          className="px-6 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner size="sm" label="분석 중..." /> : '분석 시작'}
        </button>
      </form>

      {/* 결과 */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">{result.test_title}</h3>
              <span className="text-3xl font-[var(--font-heading)] text-[var(--color-gold)]">{result.class_average}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[var(--color-gold)] h-3 rounded-full transition-all"
                style={{ width: `${result.class_average}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">반 평균 정답률</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.students.map((s) => (
              <div key={s.student_id} className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-[var(--color-navy)]">{s.student_name}</h4>
                  <span className={`text-sm font-bold ${
                    s.accuracy >= 80 ? 'text-green-600' : s.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {s.accuracy}%
                  </span>
                </div>

                {s.weak_concepts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5">취약 개념</p>
                    <div className="flex flex-wrap gap-1.5">
                      {s.weak_concepts.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">맞춤 전략</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{s.exam_strategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
