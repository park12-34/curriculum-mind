import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import PredictPage from './pages/PredictPage'
import OptimizePage from './pages/OptimizePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Layout />}>
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/optimize" element={<OptimizePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
