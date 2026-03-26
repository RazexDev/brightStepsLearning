import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import GameHub from './pages/games/GameHub';
import FocusMatch from './pages/games/FocusMatch'; // <-- 1. Import your new game!
import ProtectedRoute from './components/ProtectedRoute';
import ShapeSort from './pages/games/ShapeSort';
import EmotionExplorer from './pages/games/EmotionExplorer';
import SparkyBot from './components/chat/SparkyBot';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/games" 
          element={<ProtectedRoute><GameHub /></ProtectedRoute>} 
        />
        
        {/* 2. Add the Doorway to Game 1 */}
        <Route 
          path="/games/focus-match" 
          element={<ProtectedRoute><FocusMatch /></ProtectedRoute>} 
        />
        <Route 
  path="/games/emotion-explorer" 
  element={<ProtectedRoute><EmotionExplorer /></ProtectedRoute>} 
/>
        <Route 
  path="/games/shape-sort" 
  element={<ProtectedRoute><ShapeSort /></ProtectedRoute>} 
/>

        
      </Routes>
      <SparkyBot />
    </BrowserRouter>
  );
}

export default App;