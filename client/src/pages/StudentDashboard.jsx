import React from 'react';
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const openRoutineDashboard = (child) => {
  navigate("/routine", {
    state: { child }
  });
};

  // A quick way to test logging out
  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/');
  };

  return (
    <div style={{ padding: '50px', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'Fredoka One, cursive', color: 'var(--mint-deep)' }}>
        Welcome to the Dashboard! 🚀
      </h1>
      <p style={{ color: 'var(--text-mid)', marginTop: '20px' }}>
        You successfully logged in using the backend API.
      </p>
      
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '999px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Log Out
      </button>
    </div>
  );
}