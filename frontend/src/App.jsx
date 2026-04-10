import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import PredictPage from './pages/PredictPage'
import OptimizePage from './pages/OptimizePage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import TestsPage from './pages/TestsPage'
import AnalysisPage from './pages/AnalysisPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/optimize" element={<OptimizePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentDetailPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
