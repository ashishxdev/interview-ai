import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";
import InterviewHistory from "./pages/InterviewHistory";
import { Navigate, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthInitializer from "./components/AuthInitializer";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <>
      <AuthInitializer />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/interviews/new" element={
          <ProtectedRoute>
            <CreateInterview />
          </ProtectedRoute>
        } />
        <Route path="/interviews" element={
          <ProtectedRoute>
            <InterviewHistory />
          </ProtectedRoute>
        } />
        <Route path="/interviews/:interviewId" element={
          <ProtectedRoute>
            <InterviewSession />
          </ProtectedRoute>
        } />
        <Route path="/interviews/:interviewId/report" element={
          <ProtectedRoute>
            <InterviewReport />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App;
