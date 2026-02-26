import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import './LoginPage.css'; // 💡 Tech Lead move: Reusing the exact same CSS!

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('parent'); // Defaults to parent
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Calling your exact backend route
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login the user immediately after signing up
        localStorage.setItem('brightsteps_token', data.token);
        localStorage.setItem('brightsteps_user', JSON.stringify(data)); 
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Cannot connect to the server right now.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        
        <div className="login-header">
          <UserPlus size={40} color="#38bdf8" />
          <h2>Create Account</h2>
          <p>Join BrightSteps to support your child's journey.</p>
        </div>

        {error && <div style={{ color: '#b91c1c', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Jane Doe" 
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="parent@brightsteps.com" 
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

          {/* New Dropdown for Role Selection */}
          <div className="input-group">
            <label htmlFor="role">I am a...</label>
            <select 
              id="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              style={{ 
                width: '100%', padding: '14px 18px', border: '2px solid #e2e8f0', 
                borderRadius: '16px', fontFamily: 'Nunito, sans-serif', fontSize: '1rem', 
                color: 'var(--text-dark)', backgroundColor: '#f8fafc', cursor: 'pointer' 
              }}
            >
              <option value="parent">Parent</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {/* Changed the button color to sky blue so it looks distinct from the Login page */}
          <button type="submit" className="submit-btn" style={{ background: 'linear-gradient(135deg, var(--sky-deep) 0%, #0284c7 100%)', boxShadow: '0 4px 0px #0284c7' }}>
            Sign Up
          </button>
        </form>

        <p style={{ marginTop: '20px', color: 'var(--text-mid)', fontWeight: '600' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--sky-deep)', textDecoration: 'none' }}>Log In</Link>
        </p>
        
      </div>
    </div>
  );
}