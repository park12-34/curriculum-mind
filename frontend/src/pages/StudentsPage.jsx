import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClasses, createClass, updateClass, getStudentsByClass, createStudent, updateStudent, deleteStudent } from '../api/client'
import Spinner from '../components/Spinner'

const SUBJECT_OPTIONS = ['국어', '영어', '수학', '과학', '사회', '기타']

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 반 생성 모달
  const [showClassModal, setShowClassModal] = useState(false)
  const [className, setClassName] = useState('')
  const [teacherName, setTeacherName] = useState('')

  // 반 편집 모달
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [editClassName, setEditClassName] = useState('')
  const [editTeacherName, setEditTeacherName] = useState('')

  // 학생 추가 모달
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [studentForm, setStudentForm] = useState({
    name: '',
    birth_date: '',
    school_name: '',
    enrolled_at: '',
    is_attending: false,
    subjects: [],
  })

  // 학생 편집 모달
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    birth_date: '',
    school_name: '',
    enrolled_at: '',
    is_attending: false,
    subjects: [],
    class_id: '',
  })

  useEffect(() => {
    loadClasses()
  }, [])

  async function loadClasses() {
    setLoading(true)
    try {
      const res = await getClasses()
      setClasses(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectClass(cls) {
    setSelectedClass(cls)
    setError(null)
    try {
      const res = await getStudentsByClass(cls.id)
      setStudents(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleCreateClass(e) {
    e.preventDefault()
    try {
      await createClass({ name: className, teacher_name: teacherName || null })
      setShowClassModal(false)
      setClassName('')
      setTeacherName('')
      await loadClasses()
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  function openEditClassModal(cls, e) {
    e.stopPropagation()
    setEditingClass(cls)
    setEditClassName(cls.name || '')
    setEditTeacherName(cls.teacher_name || '')
    setShowEditClassModal(true)
  }

  async function handleUpdateClass(e) {
    e.preventDefault()
    try {
      await updateClass(editingClass.id, { name: editClassName, teacher_name: editTeacherName || null })
      setShowEditClassModal(false)
      setEditingClass(null)
      await loadClasses()
      if (selectedClass?.id === editingClass.id) {
        setSelectedClass({ ...selectedClass, name: editClassName, teacher_name: editTeacherName || null })
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  function updateStudentForm(field, value) {
    setStudentForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSubject(subject) {
    setStudentForm((prev) => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject]
      return { ...prev, subjects }
    })
  }

  async function handleCreateStudent(e) {
    e.preventDefault()
    const payload = {
      name: studentForm.name,
      class_id: selectedClass.id,
    }
    if (studentForm.birth_date) payload.birth_date = studentForm.birth_date
    if (studentForm.school_name) payload.school_name = studentForm.school_name
    if (studentForm.enrolled_at) payload.enrolled_at = studentForm.enrolled_at
    if (studentForm.is_attending) payload.is_attending = true
    if (studentForm.subjects.length > 0) payload.subjects = studentForm.subjects

    try {
      await createStudent(payload)
      setShowStudentModal(false)
      setStudentForm({ name: '', birth_date: '', school_name: '', enrolled_at: '', is_attending: false, subjects: [] })
      await handleSelectClass(selectedClass)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  function openEditModal(student) {
    setEditingStudent(student)
    setEditForm({
      name: student.name || '',
      birth_date: student.birth_date || '',
      school_name: student.school_name || '',
      enrolled_at: student.enrolled_at || '',
      is_attending: student.is_attending || false,
      subjects: student.subjects || [],
      class_id: student.class_id || selectedClass?.id || '',
    })
    setShowEditModal(true)
  }

  function updateEditForm(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleEditSubject(subject) {
    setEditForm((prev) => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject]
      return { ...prev, subjects }
    })
  }

  async function handleUpdateStudent(e) {
    e.preventDefault()
    try {
      await updateStudent(editingStudent.id, editForm)
      setShowEditModal(false)
      setEditingStudent(null)
      await handleSelectClass(selectedClass)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  async function handleDeleteStudent(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await deleteStudent(id)
      await handleSelectClass(selectedClass)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
  }

  const isClassChanged = editForm.class_id && editForm.class_id !== (editingStudent?.class_id || selectedClass?.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-[var(--font-heading)] text-[var(--color-navy)]">학생 관리</h2>
        <p className="text-gray-500 mt-1">반과 학생을 등록하고 관리합니다.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">{error}</div>
      )}

      {loading ? (
        <Spinner label="불러오는 중..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 반 목록 */}
          <div className="bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">반 목록</h3>
              <button
                onClick={() => setShowClassModal(true)}
                className="px-3 py-1.5 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-navy-light)]"
              >
                + 반 추가
              </button>
            </div>
            {classes.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 반이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="relative group">
                    <button
                      onClick={() => handleSelectClass(cls)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        selectedClass?.id === cls.id
                          ? 'bg-[var(--color-navy)] text-white'
                          : 'text-[var(--color-navy)] hover:bg-[var(--color-table-header)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{cls.name}</span>
                        <span
                          onClick={(e) => openEditClassModal(cls, e)}
                          className={`text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${
                            selectedClass?.id === cls.id ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-[var(--color-gold)]'
                          }`}
                        >
                          &#9998;
                        </span>
                      </div>
                      {cls.teacher_name && (
                        <div className={`text-xs mt-0.5 ${selectedClass?.id === cls.id ? 'text-gray-300' : 'text-gray-400'}`}>
                          {cls.teacher_name}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 학생 목록 */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-[var(--color-card-border)] p-6">
            {selectedClass ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)]">{selectedClass.name} 학생 목록</h3>
                  <button
                    onClick={() => setShowStudentModal(true)}
                    className="px-3 py-1.5 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-navy-light)]"
                  >
                    + 학생 추가
                  </button>
                </div>
                {students.length === 0 ? (
                  <p className="text-sm text-gray-400">등록된 학생이 없습니다.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-card-border)] text-left text-gray-500 bg-[var(--color-table-header)]">
                        <th className="pb-2 pt-2 px-3 font-medium rounded-tl-lg">이름</th>
                        <th className="pb-2 pt-2 px-3 font-medium">학교</th>
                        <th className="pb-2 pt-2 px-3 font-medium">수강 과목</th>
                        <th className="pb-2 pt-2 px-3 font-medium">등하원</th>
                        <th className="pb-2 pt-2 px-3 font-medium text-right rounded-tr-lg">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-b border-[var(--color-card-border)] hover:bg-[var(--color-table-hover)] transition-colors">
                          <td className="py-3 px-3">
                            <button
                              onClick={() => navigate(`/students/${s.id}`)}
                              className="text-[var(--color-navy)] hover:text-[var(--color-gold)] font-medium hover:underline"
                            >
                              {s.name}
                            </button>
                          </td>
                          <td className="py-3 px-3 text-gray-600">{s.school_name || '-'}</td>
                          <td className="py-3 px-3 text-gray-600">
                            {s.subjects && s.subjects.length > 0
                              ? s.subjects.join(', ')
                              : '-'}
                          </td>
                          <td className="py-3 px-3">
                            {s.is_attending ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">이용</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">미이용</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(s)}
                              className="text-[var(--color-gold)] hover:text-[var(--color-gold-light)] text-xs font-medium"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="text-red-400 hover:text-red-600 text-xs font-medium"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                왼쪽에서 반을 선택하세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 반 생성 모달 */}
      {showClassModal && (
        <Modal title="반 추가" onClose={() => setShowClassModal(false)}>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반 이름</label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="예: 고1A반"
                required
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당 교사</label>
              <input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="선택 사항"
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <button
              type="submit"
              disabled={!className}
              className="w-full px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
            >
              생성
            </button>
          </form>
        </Modal>
      )}

      {/* 반 편집 모달 */}
      {showEditClassModal && editingClass && (
        <Modal title="반 편집" onClose={() => setShowEditClassModal(false)}>
          <form onSubmit={handleUpdateClass} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반 이름</label>
              <input
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당 교사</label>
              <input
                value={editTeacherName}
                onChange={(e) => setEditTeacherName(e.target.value)}
                placeholder="선택 사항"
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <button
              type="submit"
              disabled={!editClassName}
              className="w-full px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
            >
              저장
            </button>
          </form>
        </Modal>
      )}

      {/* 학생 추가 모달 */}
      {showStudentModal && (
        <Modal title="학생 추가" onClose={() => setShowStudentModal(false)}>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학생 이름 *</label>
              <input
                value={studentForm.name}
                onChange={(e) => updateStudentForm('name', e.target.value)}
                placeholder="예: 김철수"
                required
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input
                type="date"
                value={studentForm.birth_date}
                onChange={(e) => updateStudentForm('birth_date', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학교명</label>
              <input
                value={studentForm.school_name}
                onChange={(e) => updateStudentForm('school_name', e.target.value)}
                placeholder="예: 서울중학교"
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">첫 등원일</label>
              <input
                type="date"
                value={studentForm.enrolled_at}
                onChange={(e) => updateStudentForm('enrolled_at', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">등하원 이용</label>
              <button
                type="button"
                onClick={() => updateStudentForm('is_attending', !studentForm.is_attending)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  studentForm.is_attending ? 'bg-[var(--color-navy)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    studentForm.is_attending ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">수강 과목</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subj) => (
                  <label
                    key={subj}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                      studentForm.subjects.includes(subj)
                        ? 'bg-[var(--color-navy)] border-[var(--color-navy)] text-white'
                        : 'bg-white border-[var(--color-card-border)] text-gray-600 hover:bg-[var(--color-table-header)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={studentForm.subjects.includes(subj)}
                      onChange={() => toggleSubject(subj)}
                      className="sr-only"
                    />
                    {subj}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={!studentForm.name}
              className="w-full px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
            >
              등록
            </button>
          </form>
        </Modal>
      )}

      {/* 학생 편집 모달 */}
      {showEditModal && editingStudent && (
        <Modal title="학생 편집" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학생 이름 *</label>
              <input
                value={editForm.name}
                onChange={(e) => updateEditForm('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반 변경</label>
              <select
                value={editForm.class_id}
                onChange={(e) => updateEditForm('class_id', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {isClassChanged && (
                <p className="text-xs text-[var(--color-gold)] mt-1">
                  * 반을 변경해도 기존 시험/성적 데이터는 유지됩니다.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input
                type="date"
                value={editForm.birth_date}
                onChange={(e) => updateEditForm('birth_date', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">학교명</label>
              <input
                value={editForm.school_name}
                onChange={(e) => updateEditForm('school_name', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">첫 등원일</label>
              <input
                type="date"
                value={editForm.enrolled_at}
                onChange={(e) => updateEditForm('enrolled_at', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-card-border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-navy)] focus:border-[var(--color-navy)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">등하원 이용</label>
              <button
                type="button"
                onClick={() => updateEditForm('is_attending', !editForm.is_attending)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  editForm.is_attending ? 'bg-[var(--color-navy)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editForm.is_attending ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">수강 과목</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subj) => (
                  <label
                    key={subj}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${
                      editForm.subjects.includes(subj)
                        ? 'bg-[var(--color-navy)] border-[var(--color-navy)] text-white'
                        : 'bg-white border-[var(--color-card-border)] text-gray-600 hover:bg-[var(--color-table-header)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.subjects.includes(subj)}
                      onChange={() => toggleEditSubject(subj)}
                      className="sr-only"
                    />
                    {subj}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={!editForm.name}
              className="w-full px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
            >
              저장
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
