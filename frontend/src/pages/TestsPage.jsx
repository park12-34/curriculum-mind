import { useState, useEffect } from 'react'
import { getClasses, getStudentsByClass, getTestsByClass, createTest, saveScores, getScoresByTest } from '../api/client'
import Spinner from '../components/Spinner'

export default function TestsPage() {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [tests, setTests] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [title, setTitle] = useState('')
  const [testDate, setTestDate] = useState('')
  const [totalQuestions, setTotalQuestions] = useState('')

  const [activeTest, setActiveTest] = useState(null)
  const [grid, setGrid] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    try {
      const res = await getClasses()
      setClasses(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleClassChange(classId) {
    setSelectedClassId(classId)
    setActiveTest(null)
    setGrid({})
    setError(null)
    setSuccess(null)
    if (!classId) { setTests([]); setStudents([]); return }
    setLoading(true)
    try {
      const [testsRes, studentsRes] = await Promise.all([
        getTestsByClass(classId),
        getStudentsByClass(classId),
      ])
      setTests(testsRes.data)
      setStudents(studentsRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTest(e) {
    e.preventDefault()
    setError(null)
    try {
      await createTest({
        title,
        test_date: testDate || null,
        class_id: selectedClassId,
        total_questions: Number(totalQuestions),
      })
      setTitle('')
      setTestDate('')
      setTotalQuestions('')
      setSuccess('시험이 생성되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await handleClassChange(selectedClassId)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleSelectTest(test) {
    setActiveTest(test)
    setGrid({})
    setSuccess(null)
    try {
      const res = await getScoresByTest(test.id)
      const loaded = {}
      for (const row of res.data) {
        loaded[`${row.student_id}_${row.question_no}`] = row.is_correct
      }
      setGrid(loaded)
    } catch {
      // no saved data
    }
  }

  function toggleCell(studentId, questionNo) {
    const key = `${studentId}_${questionNo}`
    setGrid((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSaveScores() {
    if (!activeTest || students.length === 0) return
    setSaving(true)
    setError(null)
    try {
      const items = []
      for (const s of students) {
        for (let q = 1; q <= activeTest.total_questions; q++) {
          const key = `${s.id}_${q}`
          items.push({
            student_id: s.id,
            test_id: activeTest.id,
            question_no: q,
            is_correct: !!grid[key],
          })
        }
      }
      await saveScores(items)
      setSuccess('저장 완료!')
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  const questions = activeTest ? Array.from({ length: activeTest.total_questions }, (_, i) => i + 1) : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">시험 관리</h2>
        <p className="text-gray-500 mt-1">시험을 생성하고 학생별 문항 O/X를 기록합니다.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl">{success}</div>}

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

      {selectedClassId && !loading && (
        <>
          {/* 시험 생성 */}
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">시험 생성</h3>
            <form onSubmit={handleCreateTest} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험 제목</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 4월 주간평가"
                  required
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험 날짜</label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문항 수</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                  placeholder="예: 20"
                  required
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!title || !totalQuestions}
                  className="w-full px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
                >
                  시험 생성
                </button>
              </div>
            </form>
          </div>

          {/* 시험 목록 */}
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">시험 목록</h3>
            {tests.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 시험이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {tests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTest(t)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                      activeTest?.id === t.id
                        ? 'bg-[var(--color-navy)] text-white'
                        : 'text-[var(--color-navy)] hover:bg-[var(--color-table-header)]'
                    }`}
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className={`ml-2 text-xs ${activeTest?.id === t.id ? 'text-gray-300' : 'text-gray-400'}`}>
                      {t.test_date || ''} | {t.total_questions}문항
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* O/X 그리드 */}
          {activeTest && (
            <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">
                  {activeTest.title} — O/X 입력
                </h3>
                <button
                  onClick={handleSaveScores}
                  disabled={saving || students.length === 0}
                  className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-medium text-sm hover:bg-[var(--color-gold-light)] disabled:opacity-50"
                >
                  {saving ? <Spinner size="sm" label="저장 중..." /> : '저장'}
                </button>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-gray-400">해당 반에 학생이 없습니다. 학생 관리에서 먼저 추가하세요.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-[var(--color-table-header)] px-4 py-2 text-left text-gray-500 font-medium border-b border-[var(--color-card-border)]">
                          학생
                        </th>
                        {questions.map((q) => (
                          <th key={q} className="px-3 py-2 text-center text-gray-500 font-medium border-b border-[var(--color-card-border)] min-w-[40px] bg-[var(--color-table-header)]">
                            {q}
                          </th>
                        ))}
                        <th className="px-4 py-2 text-center text-gray-500 font-medium border-b border-[var(--color-card-border)] min-w-[60px] bg-[var(--color-table-header)]">
                          정답
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const correctCount = questions.filter((q) => !!grid[`${s.id}_${q}`]).length
                        return (
                          <tr key={s.id} className="border-b border-[var(--color-card-border)] hover:bg-[var(--color-table-hover)]">
                            <td className="sticky left-0 bg-white px-4 py-2 text-[var(--color-navy)] font-medium whitespace-nowrap">
                              {s.name}
                            </td>
                            {questions.map((q) => {
                              const key = `${s.id}_${q}`
                              const isCorrect = !!grid[key]
                              return (
                                <td key={q} className="px-1 py-1 text-center">
                                  <button
                                    onClick={() => toggleCell(s.id, q)}
                                    className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                                      isCorrect
                                        ? 'bg-[var(--color-navy)] text-white'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isCorrect ? 'O' : 'X'}
                                  </button>
                                </td>
                              )
                            })}
                            <td className="px-4 py-2 text-center text-sm font-semibold text-[var(--color-navy)] whitespace-nowrap">
                              {correctCount}/{activeTest.total_questions}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loading && <Spinner label="불러오는 중..." />}
    </div>
  )
}
