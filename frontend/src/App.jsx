import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RandomQuiz from './pages/RandomQuiz';
import SubjectQuiz from './pages/SubjectQuiz';
import QuizAttempt from './pages/QuizAttempt';
import Results from './pages/Results';
import History from './pages/History';
import GroupPlay from './pages/GroupPlay';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div className="page"><div className="spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/dashboard" />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz/random" element={<RandomQuiz />} />
        <Route path="/quiz/subjects" element={<SubjectQuiz />} />
        <Route path="/quiz/attempt/:id" element={<QuizAttempt />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/group-play" element={<GroupPlay />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<div className="page container" style={{ textAlign: 'center' }}><h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>404</h1><p style={{ color: 'var(--text-secondary)' }}>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
