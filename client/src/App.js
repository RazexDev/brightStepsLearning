import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // <-- Add this import
import StudentDashboard from './pages/StudentDashboard';
import RoutineDashboard from './pages/RoutineDashboard';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} /> {/* <-- Add this route */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/routine" element={<RoutineDashboard />} />
       
      </Routes>
    </BrowserRouter>
  );
}

export default App;