import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  // 1. We added State to store the email and password they type
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(''); 

    try {
      // 2. THIS IS THE BRIDGE: Calling your Express server on Port 5001
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        localStorage.setItem('brightsteps_user', JSON.stringify(data)); 
        navigate('/dashboard'); // Success! Teleport to dashboard.
      } else {
        setError(data.message); // Show error from the backend
      }
    } catch (err) {
      setError('Cannot connect to the server right now.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        <div className="login-header">
          <Sparkles size={40} color="#f4956a" />
          <h2>Welcome Back</h2>
          <p>Log in to manage routines and track progress.</p>
        </div>

        {/* 3. SHOW ERRORS: If they type the wrong password, show this red box */}
        {error && <div style={{ color: '#b91c1c', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="teacher@brightsteps.com" 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button type="submit" className="submit-btn">
            Log In
          </button>
        </form>

        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
        
      </div>
    </div>
  );
}