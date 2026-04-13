import { useState, useEffect } from 'react'
import { getClasses, getStudentsByClass, getTestsByClass, createTest, updateTest, deleteTest, saveScores, getScoresByTest } from '../api/client'
import Spinner from '../components/Spinner'
import CsvImportModal from '../components/CsvImportModal'
import AssignmentList from '../components/AssignmentList'

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

  // CSV 업로드 모달
  const [csvModalOpen, setCsvModalOpen] = useState(false)

  // 모바일 문항 페이지네이션
  const [mobilePage, setMobilePage] = useState(0)

  // 서브탭 (tests | assignments)
  const [activeSection, setActiveSection] = useState('tests')

  // 편집 모달
  const [editModal, setEditModal] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editQuestions, setEditQuestions] = useState('')

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
    setMobilePage(0)
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

  function setCell(studentId, questionNo, value) {
    const key = `${studentId}_${questionNo}`
    setGrid((prev) => ({ ...prev, [key]: value }))
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

  function openEditModal(t) {
    setEditModal(t)
    setEditTitle(t.title)
    setEditDate(t.test_date || '')
    setEditQuestions(String(t.total_questions))
  }

  async function handleUpdateTest(e) {
    e.preventDefault()
    setError(null)
    try {
      await updateTest(editModal.id, {
        title: editTitle,
        test_date: editDate || null,
        total_questions: Number(editQuestions),
      })
      setEditModal(null)
      setSuccess('시험이 수정되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await handleClassChange(selectedClassId)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleDeleteTest(t) {
    if (!window.confirm(`"${t.title}" 시험을 삭제하시겠습니까?\n관련 성적 데이터도 모두 삭제됩니다.`)) return
    setError(null)
    try {
      await deleteTest(t.id)
      if (activeTest?.id === t.id) {
        setActiveTest(null)
        setGrid({})
      }
      setSuccess('시험이 삭제되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await handleClassChange(selectedClassId)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const questions = activeTest ? Array.from({ length: activeTest.total_questions }, (_, i) => i + 1) : []
  const MOBILE_PAGE_SIZE = 3
  const totalMobilePages = Math.ceil(questions.length / MOBILE_PAGE_SIZE)
  const mobileQuestions = questions.slice(mobilePage * MOBILE_PAGE_SIZE, (mobilePage + 1) * MOBILE_PAGE_SIZE)
  const mobileRangeStart = mobilePage * MOBILE_PAGE_SIZE + 1
  const mobileRangeEnd = Math.min((mobilePage + 1) * MOBILE_PAGE_SIZE, questions.length)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">시험 · 숙제 관리</h2>
        <p className="text-gray-500 mt-1">시험을 생성하고 학생별 문항 O/X를 기록하거나 숙제를 관리합니다.</p>
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
          {/* 서브탭 토글 */}
          <div className="border-b border-[var(--color-card-border)] flex gap-1">
            <button
              onClick={() => setActiveSection('tests')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeSection === 'tests'
                  ? 'border-[var(--color-navy)] text-[var(--color-navy)]'
                  : 'border-transparent text-gray-400 hover:text-[var(--color-navy)]'
              }`}
            >
              시험
            </button>
            <button
              onClick={() => setActiveSection('assignments')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeSection === 'assignments'
                  ? 'border-[var(--color-navy)] text-[var(--color-navy)]'
                  : 'border-transparent text-gray-400 hover:text-[var(--color-navy)]'
              }`}
            >
              숙제
            </button>
          </div>
        </>
      )}

      {selectedClassId && !loading && activeSection === 'assignments' && (
        <AssignmentList classId={selectedClassId} />
      )}

      {selectedClassId && !loading && activeSection === 'tests' && (
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
                  <div
                    key={t.id}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors ${
                      activeTest?.id === t.id
                        ? 'bg-[var(--color-navy)] text-white'
                        : 'text-[var(--color-navy)] hover:bg-[var(--color-table-header)]'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectTest(t)}
                      className="flex-1 text-left"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className={`ml-2 text-xs ${activeTest?.id === t.id ? 'text-gray-300' : 'text-gray-400'}`}>
                        {t.test_date || ''} | {t.total_questions}문항
                      </span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(t) }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        activeTest?.id === t.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-gray-200 text-gray-400'
                      }`}
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTest(t) }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        activeTest?.id === t.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                      }`}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* O/X 그리드 */}
          {activeTest && (
            <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
                <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">
                  {activeTest.title} — O/X 입력
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setCsvModalOpen(true)}
                    className="px-4 py-2 border border-[var(--color-card-border)] text-[var(--color-navy)] rounded-lg font-medium text-sm whitespace-nowrap hover:bg-[var(--color-table-header)] transition-colors"
                  >
                    CSV 업로드
                  </button>
                  <button
                    onClick={handleSaveScores}
                    disabled={saving || students.length === 0}
                    className="px-4 py-2 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-medium text-sm whitespace-nowrap hover:bg-[var(--color-gold-light)] disabled:opacity-50"
                  >
                    {saving ? <Spinner size="sm" label="저장 중..." /> : '저장'}
                  </button>
                </div>
              </div>

              {students.length === 0 ? (
                <p className="text-sm text-gray-400">해당 반에 학생이 없습니다. 학생 관리에서 먼저 추가하세요.</p>
              ) : (
                <>
                  {/* 모바일 페이지네이션 컨트롤 */}
                  {totalMobilePages > 1 && (
                    <div className="flex items-center justify-between mb-3 md:hidden">
                      <button
                        onClick={() => setMobilePage((p) => p - 1)}
                        disabled={mobilePage === 0}
                        className="px-3 py-1.5 border border-[var(--color-card-border)] rounded-lg text-xs font-medium text-[var(--color-navy)] disabled:opacity-30"
                      >
                        이전
                      </button>
                      <span className="text-xs text-gray-500">
                        문항 {mobileRangeStart}~{mobileRangeEnd} / {questions.length}
                      </span>
                      <button
                        onClick={() => setMobilePage((p) => p + 1)}
                        disabled={mobilePage >= totalMobilePages - 1}
                        className="px-3 py-1.5 border border-[var(--color-card-border)] rounded-lg text-xs font-medium text-[var(--color-navy)] disabled:opacity-30"
                      >
                        다음
                      </button>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 bg-[var(--color-table-header)] px-4 py-2 text-left text-gray-500 font-medium border-b border-[var(--color-card-border)]">
                            학생
                          </th>
                          {/* 데스크탑: 전체 문항 / 모바일: 페이지네이션 */}
                          {questions.map((q) => (
                            <th
                              key={q}
                              className={`px-2 py-2 text-center text-gray-500 font-medium border-b border-[var(--color-card-border)] min-w-[80px] md:min-w-[68px] bg-[var(--color-table-header)] ${
                                mobileQuestions.includes(q) ? '' : 'hidden md:table-cell'
                              }`}
                            >
                              {q}
                            </th>
                          ))}
                          <th className="hidden md:table-cell px-4 py-2 text-center text-gray-500 font-medium border-b border-[var(--color-card-border)] min-w-[60px] bg-[var(--color-table-header)]">
                            정답
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const correctCount = questions.filter((q) => !!grid[`${s.id}_${q}`]).length
                          const hasWrong = correctCount < questions.length
                          const rowBg = hasWrong
                            ? 'bg-red-50/60 hover:bg-red-50'
                            : 'hover:bg-[var(--color-table-hover)]'
                          const stickyBg = hasWrong ? 'bg-red-50' : 'bg-white'
                          return (
                            <tr key={s.id} className={`border-b border-[var(--color-card-border)] ${rowBg}`}>
                              <td className={`sticky left-0 z-10 ${stickyBg} px-4 py-2 text-[var(--color-navy)] font-medium whitespace-nowrap`}>
                                {s.name}
                              </td>
                              {questions.map((q) => {
                                const key = `${s.id}_${q}`
                                const isCorrect = !!grid[key]
                                return (
                                  <td
                                    key={q}
                                    className={`px-1 py-1 text-center ${
                                      mobileQuestions.includes(q) ? '' : 'hidden md:table-cell'
                                    }`}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => setCell(s.id, q, true)}
                                        aria-label={`문항 ${q} 정답`}
                                        className={`min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 w-7 h-7 md:w-7 md:h-7 rounded-md text-xs font-bold transition-colors active:scale-95 ${
                                          isCorrect
                                            ? 'bg-[var(--color-navy)] text-white'
                                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                        }`}
                                      >
                                        O
                                      </button>
                                      <button
                                        onClick={() => setCell(s.id, q, false)}
                                        aria-label={`문항 ${q} 오답`}
                                        className={`min-w-[36px] min-h-[36px] md:min-w-0 md:min-h-0 w-7 h-7 md:w-7 md:h-7 rounded-md text-xs font-bold transition-colors active:scale-95 ${
                                          !isCorrect
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-300 hover:bg-gray-200'
                                        }`}
                                      >
                                        X
                                      </button>
                                    </div>
                                  </td>
                                )
                              })}
                              <td className="hidden md:table-cell px-4 py-2 text-center text-sm font-semibold text-[var(--color-navy)] whitespace-nowrap">
                                {correctCount}/{activeTest.total_questions}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {loading && <Spinner label="불러오는 중..." />}

      {/* 편집 모달 */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">시험 수정</h3>
            <form onSubmit={handleUpdateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험 제목</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시험 날짜</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">문항 수</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editQuestions}
                  onChange={(e) => setEditQuestions(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-card-border)] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editTitle || !editQuestions}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV 업로드 모달 */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        testId={activeTest?.id}
        classId={selectedClassId}
        onSuccess={() => handleSelectTest(activeTest)}
      />
    </div>
  )
}
