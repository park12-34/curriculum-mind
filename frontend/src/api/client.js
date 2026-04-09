import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
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

export default api
