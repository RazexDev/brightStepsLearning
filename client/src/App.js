import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import RoutineDashboard from './pages/RoutineDashboard';
import GameHub from './pages/games/GameHub';
import FocusMatch from './pages/games/FocusMatch'; // <-- 1. Import your new game!
import ProtectedRoute from './components/ProtectedRoute';
import ShapeSort from './pages/games/ShapeSort';
import EmotionExplorer from './pages/games/EmotionExplorer';
import SparkyBot from './components/chat/SparkyBot';
import TeacherDashboard from './pages/TeacherDashboard';
import LearningHub from './pages/LearningHub';
import ResourceManager from './pages/ResourceManager';
import ParentDashboard from './pages/ParentDashboard';
import DummyReportTool from './pages/DummyReportTool';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/AdminDashboard';


function AppContent() {
  const location = useLocation();
  const studentPaths = ['/dashboard', '/games', '/routines', '/learning-hub'];
  const showSparky = studentPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/routines" element={<ProtectedRoute><RoutineDashboard /></ProtectedRoute>} />
        <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/learning-hub" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
        <Route path="/manage-resources" element={<ProtectedRoute><ResourceManager /></ProtectedRoute>} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/dummy-reports" element={<ProtectedRoute><DummyReportTool /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="/games" element={<ProtectedRoute><GameHub /></ProtectedRoute>} />
        <Route path="/games/focus-match" element={<ProtectedRoute><FocusMatch /></ProtectedRoute>} />
        <Route path="/games/emotion-explorer" element={<ProtectedRoute><EmotionExplorer /></ProtectedRoute>} />
        <Route path="/games/shape-sort" element={<ProtectedRoute><ShapeSort /></ProtectedRoute>} />
      </Routes>
      {showSparky && <SparkyBot />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;