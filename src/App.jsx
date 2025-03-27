import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/Login"
import RegistrationPage from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ImageAnalysisPage from "./pages/ImageAnalysisPage"
import VideoAnalysisPage from "./pages/ImageAnalysisPage"
import AudioAnalysisPage from "./pages/ImageAnalysisPage"
import TextAnalysisPage from "./pages/ImageAnalysisPage"
import LiveStreamingAnalysisPage from "./pages/ImageAnalysisPage"
const AppRoutes = ()=> {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />
      
      {/* Dashboard routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/image-analysis" element={<ImageAnalysisPage />} />
      <Route path="/video-analysis" element={<VideoAnalysisPage />} />
      <Route path="/audio-analysis" element={<AudioAnalysisPage />} />
      <Route path="/text-analysis" element={<TextAnalysisPage />} />
      <Route path="/live-streaming-analysis" element={<LiveStreamingAnalysisPage />} />
      
      {/* 404 route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
