import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function analyzeGap(curriculumFile, assessmentFile) {
  const form = new FormData()
  form.append('curriculum_file', curriculumFile)
  form.append('assessment_file', assessmentFile)
  const { data } = await api.post('/api/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function predictStruggles(quizRecords, threshold = 60) {
  const { data } = await api.post('/api/predict', {
    quiz_records: quizRecords,
    threshold,
  })
  return data
}

export async function optimizeCurriculum(gaps, coverageScore, totalHours = 16, priorities = null) {
  const { data } = await api.post('/api/optimize', {
    gaps,
    coverage_score: coverageScore,
    total_hours: totalHours,
    priorities,
  })
  return data
}

// ── Classes ──────────────────────────────────────────────

export async function getClasses() {
  const { data } = await api.get('/api/classes')
  return data
}

export async function createClass(body) {
  const { data } = await api.post('/api/classes', body)
  return data
}

export async function updateClass(classId, body) {
  const { data } = await api.put(`/api/classes/${classId}`, body)
  return data
}

// ── Students ─────────────────────────────────────────────

export async function getStudentsByClass(classId) {
  const { data } = await api.get(`/api/classes/${classId}/students`)
  return data
}

export async function getStudent(studentId) {
  const { data } = await api.get(`/api/students/${studentId}`)
  return data
}

export async function createStudent(body) {
  const { data } = await api.post('/api/students', body)
  return data
}

export async function updateStudent(studentId, body) {
  const { data } = await api.put(`/api/students/${studentId}`, body)
  return data
}

export async function deleteStudent(studentId) {
  const { data } = await api.delete(`/api/students/${studentId}`)
  return data
}

export async function getStudentHistory(studentId) {
  const { data } = await api.get(`/api/students/${studentId}/history`)
  return data
}

// ── Tests ────────────────────────────────────────────────

export async function createTest(body) {
  const { data } = await api.post('/api/tests', body)
  return data
}

export async function updateTest(testId, body) {
  const { data } = await api.put(`/api/tests/${testId}`, body)
  return data
}

export async function deleteTest(testId) {
  const { data } = await api.delete(`/api/tests/${testId}`)
  return data
}

export async function getTestsByClass(classId) {
  const { data } = await api.get(`/api/classes/${classId}/tests`)
  return data
}

// ── Scores ───────────────────────────────────────────────

export async function getScoresByTest(testId) {
  const { data } = await api.get(`/api/tests/${testId}/scores`)
  return data
}

export async function saveScores(items) {
  const { data } = await api.post('/api/scores/batch', items)
  return data
}

// ── Assignments ──────────────────────────────────────────

export async function getAssignmentsByClass(classId) {
  const { data } = await api.get(`/api/classes/${classId}/assignments`)
  return data
}

export async function createAssignment(body) {
  const { data } = await api.post('/api/assignments', body)
  return data
}

export async function updateAssignment(assignmentId, body) {
  const { data } = await api.put(`/api/assignments/${assignmentId}`, body)
  return data
}

export async function deleteAssignment(assignmentId) {
  const { data } = await api.delete(`/api/assignments/${assignmentId}`)
  return data
}

export async function getAssignmentSubmissions(assignmentId) {
  const { data } = await api.get(`/api/assignments/${assignmentId}/submissions`)
  return data
}

export async function saveAssignmentSubmissions(assignmentId, items) {
  const { data } = await api.post(`/api/assignments/${assignmentId}/submissions/batch`, items)
  return data
}

// ── Analysis ─────────────────────────────────────────────

export async function analyzePattern(studentId) {
  const { data } = await api.post(`/api/analysis/pattern/${studentId}`)
  return data
}

export async function analyzeTrajectory(studentId) {
  const { data } = await api.post(`/api/analysis/trajectory/${studentId}`)
  return data
}

export async function askCoach(question, classId) {
  const { data } = await api.post('/api/analysis/coach', { question, class_id: classId })
  return data
}

export async function analyzeCompare(studentId, testIds) {
  const { data } = await api.post('/api/analysis/compare', { student_id: studentId, test_ids: testIds })
  return data
}

export default api
