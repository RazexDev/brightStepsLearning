import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import ResourceManager from './pages/ResourceManager';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        
        {/* Your correct Resource route */}
        <Route path="/manage-resources" element={<ResourceManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;