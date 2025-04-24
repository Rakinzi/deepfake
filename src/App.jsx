import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import LoginPage from "./pages/Login"
import RegistrationPage from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ImageAnalysisPage from "./pages/ImageAnalysisPage"
import VideoAnalysisPage from "./pages/VideoAnalysisPage"
import AudioAnalysisPage from "./pages/AudioAnalysisPage"
import TextAnalysisPage from "./pages/TextAnalysisPage"
import LiveStreamingAnalysisPage from "./pages/LiveStreamingAnalysis"
import AuthService from "./services/AuthService"

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = AuthService.isLoggedIn();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />

      {/* Protected Dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/image-analysis"
        element={
          <ProtectedRoute>
            <ImageAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-analysis"
        element={
          <ProtectedRoute>
            <VideoAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audio-analysis"
        element={
          <ProtectedRoute>
            <AudioAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/text-analysis"
        element={
          <ProtectedRoute>
            <TextAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-streaming-analysis"
        element={
          <ProtectedRoute>
            <LiveStreamingAnalysisPage />
          </ProtectedRoute>
        }
      />

      {/* 404 route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  // Check for token expiration
  useEffect(() => {
    const checkAuthStatus = () => {
      if (AuthService.isLoggedIn()) {
        // TODO: Implement token refresh logic if needed
        // For now, we'll just check if the token exists
      }
    };

    checkAuthStatus();

    // Set up interval to check token status
    const interval = setInterval(checkAuthStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App