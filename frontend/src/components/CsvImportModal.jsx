import { useState } from 'react'
import { getStudentsByClass, saveScores } from '../api/client'

const TRUTHY = new Set(['O', 'o', '1', 'TRUE', 'true'])

function parseCsv(text) {
  const cleaned = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = cleaned.split('\n').filter((l) => l.trim() !== '')
  if (lines.length < 2) throw new Error('헤더와 데이터 행이 필요합니다.')

  const header = lines[0].split(',').map((h) => h.trim())
  if (header[0] !== 'student_name') {
    throw new Error('첫 번째 열은 "student_name"이어야 합니다.')
  }

  const questionNos = header.slice(1).map((h) => {
    const n = parseInt(h, 10)
    if (isNaN(n)) throw new Error(`문항 번호가 올바르지 않습니다: "${h}"`)
    return n
  })

  const students = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const name = cols[0]
    if (!name) continue
    const answers = {}
    for (let j = 0; j < questionNos.length; j++) {
      answers[questionNos[j]] = TRUTHY.has(cols[j + 1] || '')
    }
    students.push({ name, answers })
  }

  return { questionNos, students }
}

export default function CsvImportModal({ isOpen, onClose, testId, classId, onSuccess }) {
  const [step, setStep] = useState('select')
  const [parsedData, setParsedData] = useState(null)
  const [matched, setMatched] = useState([])
  const [unmatched, setUnmatched] = useState([])
  const [error, setError] = useState(null)

  if (!isOpen) return null

  function handleClose() {
    setStep('select')
    setParsedData(null)
    setMatched([])
    setUnmatched([])
    setError(null)
    onClose()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = parseCsv(ev.target.result)
        setParsedData(data)

        const res = await getStudentsByClass(classId)
        const dbStudents = res.data
        const nameMap = {}
        for (const s of dbStudents) {
          nameMap[s.name] = s.id
        }

        const m = []
        const um = []
        for (const csvStudent of data.students) {
          const studentId = nameMap[csvStudent.name]
          if (studentId) {
            m.push({ student_id: studentId, name: csvStudent.name, answers: csvStudent.answers })
          } else {
            um.push(csvStudent.name)
          }
        }
        setMatched(m)
        setUnmatched(um)
        setStep('preview')
      } catch (err) {
        alert('CSV 형식이 올바르지 않습니다: ' + err.message)
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleUpload() {
    if (!parsedData || matched.length === 0) return
    setStep('uploading')
    try {
      const items = []
      for (const student of matched) {
        for (const qNo of parsedData.questionNos) {
          items.push({
            student_id: student.student_id,
            test_id: testId,
            question_no: qNo,
            is_correct: student.answers[qNo] ?? false,
          })
        }
      }
      await saveScores(items)
      alert(`${items.length}개 성적이 저장되었습니다.`)
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('CSV upload error:', err)
      alert('업로드 실패: ' + (err.response?.data?.detail || err.message))
      setStep('preview')
    }
  }

  const totalItems = matched.length * (parsedData?.questionNos.length || 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
        <h3 className="text-lg font-[var(--font-heading)] text-[var(--color-navy)] mb-4">CSV 성적 업로드</h3>

        {/* 파일 선택 */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-3">
                CSV 파일을 선택하세요. 형식: 첫 행 <code className="bg-gray-100 px-1 rounded text-xs">student_name,1,2,3,...</code>
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-navy)] file:text-white hover:file:bg-[var(--color-navy-light)]"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-[var(--color-card-border)] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 미리보기 */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600 font-medium">매칭</p>
                <p className="text-xl font-bold text-green-700">{matched.length}명</p>
              </div>
              <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <p className="text-xs text-yellow-600 font-medium">미매칭 (스킵)</p>
                <p className="text-xl font-bold text-yellow-700">{unmatched.length}명</p>
              </div>
            </div>

            {unmatched.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <p className="text-xs text-yellow-700 font-medium mb-1">미매칭 학생:</p>
                <p className="text-sm text-yellow-600">{unmatched.join(', ')}</p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              총 <span className="font-semibold text-[var(--color-navy)]">{totalItems}개</span>의 성적이 저장됩니다.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 border border-[var(--color-card-border)] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={matched.length === 0}
                className="flex-1 px-4 py-2.5 bg-[var(--color-navy)] text-white rounded-lg font-medium text-sm hover:bg-[var(--color-navy-light)] disabled:opacity-50"
              >
                업로드
              </button>
            </div>
          </div>
        )}

        {/* 업로드 중 */}
        {step === 'uploading' && (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[var(--color-navy)] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">업로드 중...</p>
          </div>
        )}
      </div>
    </div>
  )
}
