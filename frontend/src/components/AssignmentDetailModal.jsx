import { useState, useEffect } from 'react'
import { getAssignmentSubmissions, saveAssignmentSubmissions } from '../api/client'
import Spinner from './Spinner'

export default function AssignmentDetailModal({ isOpen, onClose, assignmentId, onSaved }) {
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [original, setOriginal] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !assignmentId) return
    loadData()
  }, [isOpen, assignmentId])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await getAssignmentSubmissions(assignmentId)
      setAssignment(res.data.assignment)
      setSubmissions(res.data.submissions)
      const orig = {}
      for (const s of res.data.submissions) {
        orig[s.student_id] = s.is_completed
      }
      setOriginal(orig)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleStudent(studentId) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, is_completed: !s.is_completed } : s
      )
    )
  }

  const completedCount = submissions.filter((s) => s.is_completed).length
  const totalCount = submissions.length
  const hasChanges = submissions.some((s) => s.is_completed !== original[s.student_id])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const items = submissions.map((s) => ({
        student_id: s.student_id,
        is_completed: s.is_completed,
      }))
      await saveAssignmentSubmissions(assignmentId, items)
      if (onSaved) onSaved()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col">
        {loading ? (
          <div className="py-8"><Spinner label="불러오는 중..." /></div>
        ) : (
          <>
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">
                {assignment?.title || '숙제'}
              </h3>
              {assignment?.due_date && (
                <p className="text-sm text-gray-500 mt-1">마감: {assignment.due_date}</p>
              )}
              <p className="text-sm text-[var(--color-navy)] font-semibold mt-2">
                완료: {completedCount}/{totalCount}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto border border-[var(--color-card-border)] rounded-xl">
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-400 p-4">반에 학생이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-[var(--color-card-border)]">
                  {submissions.map((s) => (
                    <li key={s.student_id}>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--color-table-hover)]">
                        <input
                          type="checkbox"
                          checked={s.is_completed}
                          onChange={() => toggleStudent(s.student_id)}
                          className="w-5 h-5 rounded accent-[var(--color-navy)]"
                        />
                        <span className={`text-sm ${s.is_completed ? 'text-[var(--color-navy)] font-medium' : 'text-gray-700'}`}>
                          {s.student_name}
                        </span>
                        {s.is_completed && (
                          <span className="ml-auto text-xs text-green-600 font-medium">완료</span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-[var(--color-card-border)] text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex-1 px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
              >
                {saving ? <Spinner size="sm" label="저장 중..." /> : '저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
