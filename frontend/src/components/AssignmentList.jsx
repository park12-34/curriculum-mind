import { useState, useEffect } from 'react'
import {
  getAssignmentsByClass,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../api/client'
import Spinner from './Spinner'
import AssignmentDetailModal from './AssignmentDetailModal'

export default function AssignmentList({ classId }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  const [editTarget, setEditTarget] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const [detailId, setDetailId] = useState(null)

  useEffect(() => {
    if (classId) loadAssignments()
    else setAssignments([])
  }, [classId])

  async function loadAssignments() {
    if (!classId) return
    setLoading(true)
    setError(null)
    try {
      const res = await getAssignmentsByClass(classId)
      setAssignments(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      await createAssignment({
        class_id: classId,
        title,
        description: description || null,
        due_date: dueDate || null,
      })
      setTitle('')
      setDueDate('')
      setDescription('')
      setShowCreateForm(false)
      setSuccess('숙제가 생성되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await loadAssignments()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  function openEdit(a) {
    setEditTarget(a)
    setEditTitle(a.title)
    setEditDue(a.due_date || '')
    setEditDesc(a.description || '')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setError(null)
    try {
      await updateAssignment(editTarget.id, {
        title: editTitle,
        due_date: editDue || null,
        description: editDesc || null,
      })
      setEditTarget(null)
      setSuccess('숙제가 수정되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await loadAssignments()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleDelete(a) {
    if (!window.confirm(`"${a.title}" 숙제를 삭제하시겠습니까?\n관련 제출 기록도 모두 삭제됩니다.`)) return
    setError(null)
    try {
      await deleteAssignment(a.id)
      setSuccess('숙제가 삭제되었습니다.')
      setTimeout(() => setSuccess(null), 2000)
      await loadAssignments()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl">{success}</div>}

      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">숙제 목록</h3>
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)]"
          >
            {showCreateForm ? '취소' : '+ 새 숙제'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-[var(--color-table-header)] rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 1주차 수학 문제 풀이"
                required
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="(선택) 상세 설명을 입력하세요"
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!title}
                className="px-5 py-2 bg-[var(--color-gold)] text-[var(--color-navy)] rounded-lg font-medium text-sm hover:bg-[var(--color-gold-light)] disabled:opacity-50"
              >
                생성
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <Spinner label="불러오는 중..." />
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 숙제가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="border border-[var(--color-card-border)] rounded-xl p-4 hover:bg-[var(--color-table-hover)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-navy)] truncate">{a.title}</h4>
                    {a.due_date && (
                      <p className="text-xs text-gray-500 mt-1">마감: {a.due_date}</p>
                    )}
                    {a.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400"
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>완료율</span>
                      <span className="font-semibold text-[var(--color-navy)]">
                        {a.completion_rate}% ({a.completed_count}/{a.total_students})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-gold)] transition-all"
                        style={{ width: `${a.completion_rate}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailId(a.id)}
                    className="px-3 py-2 border border-[var(--color-card-border)] text-[var(--color-navy)] rounded-lg text-xs font-medium whitespace-nowrap hover:bg-[var(--color-table-header)]"
                  >
                    학생 체크 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 편집 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">숙제 수정</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
                <input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-card-border)] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!editTitle}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      <AssignmentDetailModal
        isOpen={!!detailId}
        onClose={() => setDetailId(null)}
        assignmentId={detailId}
        onSaved={loadAssignments}
      />
    </div>
  )
}
