import { useState, useRef } from 'react'
import { analyzeGap } from '../api/client'
import Spinner from '../components/Spinner'

const LEVEL_COLOR = {
  '상': 'bg-green-100 text-green-800',
  '중': 'bg-yellow-100 text-yellow-800',
  '하': 'bg-orange-100 text-orange-800',
  '없음': 'bg-red-100 text-red-800',
}

function FileDropZone({ label, accept, file, onFile }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFile(e.target.files[0])}
        className="hidden"
      />
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      {file ? (
        <p className="text-sm text-green-700 font-medium">{file.name}</p>
      ) : (
        <p className="text-xs text-gray-400">클릭 또는 파일을 드래그하세요</p>
      )}
    </div>
  )
}

export default function AnalyzePage() {
  const [curriculumFile, setCurriculumFile] = useState(null)
  const [assessmentFile, setAssessmentFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!curriculumFile || !assessmentFile) return

    setLoading(true)
    setError(null)
    try {
      const res = await analyzeGap(curriculumFile, assessmentFile)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Learning Gap Analysis</h2>
        <p className="text-gray-500 mt-1">커리큘럼 PDF와 평가 데이터를 업로드하면 학습 갭을 분석합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileDropZone
            label="커리큘럼 PDF"
            accept=".pdf"
            file={curriculumFile}
            onFile={setCurriculumFile}
          />
          <FileDropZone
            label="평가 데이터 (PDF / CSV)"
            accept=".pdf,.csv"
            file={assessmentFile}
            onFile={setAssessmentFile}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !curriculumFile || !assessmentFile}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Spinner size="sm" label="분석 중..." /> : '분석 시작'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">커버리지 점수</h3>
              <span className="text-3xl font-bold text-blue-600">{result.coverage_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${result.coverage_score}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">학습 갭 상세</h3>
            <div className="space-y-3">
              {result.gaps.map((gap, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{gap.topic}</p>
                    <p className="text-sm text-gray-500 mt-1">{gap.gap_description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${LEVEL_COLOR[gap.taught_level] || 'bg-gray-100'}`}>
                      교육: {gap.taught_level}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${LEVEL_COLOR[gap.assessed_level] || 'bg-gray-100'}`}>
                      평가: {gap.assessed_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.recommendations && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">권고사항</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-500 mt-0.5">&#x2022;</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
