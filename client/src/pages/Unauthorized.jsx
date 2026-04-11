import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif", background: '#f0f9ff', textAlign: 'center', padding: 24
    }}>
      <div style={{ fontSize: '5rem', marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.2rem', color: '#1e293b', marginBottom: 8 }}>
        Access Denied
      </h1>
      <p style={{ color: '#475569', fontWeight: 700, fontSize: '1.05rem', marginBottom: 28, maxWidth: 400 }}>
        You don't have permission to view this page. Please log in with the correct account.
      </p>
      <Link to="/login" style={{
        background: 'linear-gradient(135deg, #38bdf8, #34d399)',
        color: 'white', textDecoration: 'none', padding: '13px 32px',
        borderRadius: '999px', fontWeight: 800, fontSize: '1rem',
        boxShadow: '0 4px 0 #0ea5e9'
      }}>
        Back to Login
      </Link>
    </div>
  );
}
