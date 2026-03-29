import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './LoginPage.css';

/* ─────────────────────────────────────────
   LEFT PANEL — brand / decorative side
───────────────────────────────────────── */
function RegisterPanel({ role }) {
  return (
    <div className="login-panel">
      {/* Logo */}
      <Link to="/" className="lp-brand">
        <div className="lp-logo-badge">✨</div>
        <span className="lp-logo-name">
          Bright<em>Steps</em>
        </span>
      </Link>

      {/* Middle content */}
      <div className="lp-middle">
        <div>
          <h2 className="lp-headline">
            Join the<br />
            <span className="lp-hl-accent">bright</span><br />
            community 🌟
          </h2>
          <p className="lp-sub" style={{ marginTop: 14 }}>
            {role === 'teacher'
              ? 'Support your whole classroom with visual routines, focus games, and individual progress tracking.'
              : 'Give your child the calm, structured environment they need to thrive — every single day.'}
          </p>
        </div>

        {/* Floating mini-cards */}
        <div className="lp-cards">
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-rose">🎮</div>
            <div className="lp-mc-text">
              <strong>3 Focus Games</strong>
              <span>Pattern Match · Memory · Puzzles</span>
            </div>
          </div>
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-amber">📅</div>
            <div className="lp-mc-text">
              <strong>Visual Schedules</strong>
              <span>Predictable · Calm · Customisable</span>
            </div>
          </div>
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-sage">⭐</div>
            <div className="lp-mc-text">
              <strong>Star Rewards</strong>
              <span>Milestones · Streaks · Reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="lp-bottom">
        <span className="lp-dot" />
        Free to start · No credit card · Safe for all ages
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [parentPin, setParentPin] = useState(''); 
  const [role, setRole]         = useState('parent');
  const [diagnosis, setDiagnosis] = useState('Autism');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [registeredId, setRegisteredId] = useState(null);

  // 🚀 NEW STATE: Tracks if we are in Step 2 of Google Auth
  const [isGoogleSetup, setIsGoogleSetup] = useState(false);
  const [googleToken, setGoogleToken] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Quick validation before hitting the server
    if (parentPin.length !== 4) {
      setError('Parent PIN must be exactly 4 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 👇 Send the googleToken if it exists
        body: JSON.stringify({ name, email, password, role, parentPin, googleToken, diagnosis }), 
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        const userToSave = data.user || data;
        localStorage.setItem('brightsteps_user', JSON.stringify(userToSave));
        
        // Modal interception!
        if (data.customId || userToSave.customId) {
          setRegisteredId(data.customId || userToSave.customId);
        } else {
          // Fallback if missing
          navigate(role === 'teacher' ? '/teacher-dashboard' : '/dashboard');
        }
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Cannot connect to the server right now.');
    } finally {
      setLoading(false);
    }
  };

  // 👇 UPDATED: Google Registration Handler for Two-Step Flow
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, role }), 
      });
      const data = await response.json();

      // 🚀 NEW: If it's a new user, switch to Step 2!
      if (data.isNewUser) {
        setIsGoogleSetup(true);
        setName(data.name); // Pre-fill their Google name (they can edit it)
        setEmail(data.email);
        setGoogleToken(data.googleToken);
        setLoading(false);
        return; 
      }

      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        const userToSave = data.user || data;
        localStorage.setItem('brightsteps_user', JSON.stringify(userToSave));
        
        if (data.customId || userToSave.customId) {
          setRegisteredId(data.customId || userToSave.customId);
        } else {
          navigate(userToSave.role === 'teacher' ? '/teacher-dashboard' : '/dashboard');
        }
      } else {
        setError(data.message || 'Google signup failed.');
      }
    } catch (err) {
      setError('Cannot connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      {/* ── SUCCESS MODAL ── */}
      {registeredId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: '"Baloo 2", cursive', fontSize: '1.8rem', color: '#1E1007', marginBottom: '8px' }}>Registration Successful!</h2>
            <p style={{ color: '#4A3D35', marginBottom: '24px' }}>Please write down your Institutional ID. You may need it for teacher connections.</p>
            <div style={{ background: '#F8FAFC', border: '2px dashed #CBD5E1', padding: '16px', borderRadius: '12px', fontSize: '1.7rem', fontWeight: 800, color: '#6366F1', letterSpacing: '2px', marginBottom: '32px' }}>
              {registeredId}
            </div>
            <button 
              onClick={() => navigate(role === 'teacher' ? '/teacher-dashboard' : '/dashboard')}
              style={{ background: '#6366F1', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', width: '100%', fontSize: '1rem' }}
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ── LEFT — decorative panel ── */}
      <RegisterPanel role={role} />

      {/* ── RIGHT — form ── */}
      <div className="login-form-side">
        <div className="login-form-box">

          {/* Back to home */}
          <Link to="/" className="lf-back">
            <ArrowLeft size={14} />
            Back to home
          </Link>

          {/* Header */}
          <div className="lf-header">
            <div className="lf-eyebrow">
              ✨ {isGoogleSetup ? "Almost There!" : "Join BrightSteps — It's Free"}
            </div>
            <h1 className="lf-title">
              {isGoogleSetup ? "Complete Profile" : "Create your account"}
            </h1>
            <p className="lf-sub">
              {isGoogleSetup 
                ? "Please set your display name, role, and a secure 4-digit PIN." 
                : "Set up in under a minute and start supporting your child today."}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="lf-error">
              <span className="lf-error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister}>
            <div className="lf-fields">

              {/* Role selector */}
              <div className="lf-field">
                <span className="lf-label">I am a…</span>
                <div className="lf-role-group">
                  <button
                    type="button"
                    className={`lf-role-btn${role === 'parent' ? ' active' : ''}`}
                    onClick={() => setRole('parent')}
                  >
                    <span className="lf-role-emoji">👨‍👩‍👧</span>
                    Parent
                  </button>
                  <button
                    type="button"
                    className={`lf-role-btn${role === 'teacher' ? ' active' : ''}`}
                    onClick={() => setRole('teacher')}
                  >
                    <span className="lf-role-emoji">👩‍🏫</span>
                    Teacher
                  </button>
                </div>
              </div>

              {/* Full name */}
              <div className="lf-field">
                <label className="lf-label" htmlFor="name">Display Name</label>
                <div className="lf-input-wrap">
                  <span className="lf-input-icon"><User size={16} /></span>
                  <input
                    className="lf-input"
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="lf-field">
                <label className="lf-label" htmlFor="email">Email address</label>
                <div className="lf-input-wrap">
                  <span className="lf-input-icon"><Mail size={16} /></span>
                  <input
                    className="lf-input"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={isGoogleSetup} 
                    style={{ opacity: isGoogleSetup ? 0.6 : 1, cursor: isGoogleSetup ? 'not-allowed' : 'text' }}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* 🚀 Hide password field if they are using Google! */}
              {!isGoogleSetup && (
                <div className="lf-field">
                  <label className="lf-label" htmlFor="password">Password</label>
                  <div className="lf-input-wrap">
                    <span className="lf-input-icon"><Lock size={16} /></span>
                    <input
                      className="lf-input"
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* 4-Digit Parent PIN */}
              <div className="lf-field">
                <label className="lf-label" htmlFor="parentPin">Parent PIN (4 Digits)</label>
                <div className="lf-input-wrap">
                  <span className="lf-input-icon"><Key size={16} /></span>
                  <input
                    className="lf-input"
                    type="password"
                    id="parentPin"
                    value={parentPin}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, '');
                      setParentPin(onlyNums.slice(0, 4));
                    }}
                    placeholder="1234"
                    required
                    inputMode="numeric"
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginTop: '4px', fontWeight: '700' }}>
                  Used to unlock the Parent Dashboard settings.
                </p>
              </div>

              {/* Diagnosis Selection (Parent Only) */}
              {role === 'parent' && (
                <div className="lf-field">
                  <label className="lf-label" htmlFor="diagnosis">Primary Diagnosis focus</label>
                  <div className="lf-input-wrap">
                    <select
                      className="lf-input"
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      style={{ paddingLeft: '14px', appearance: 'none' }}
                    >
                      <option value="Autism">Autism Spectrum</option>
                      <option value="ADHD">ADHD</option>
                      <option value="Both">Both (Autism + ADHD)</option>
                      <option value="None">Prefer not to say / None</option>
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* Submit */}
            <button
              type="submit"
              className="lf-submit"
              disabled={loading}
              style={{ marginTop: 24 }}
            >
              {loading ? (
                <>
                  <span className="lf-spinner" />
                  Creating account…
                </>
              ) : (
                <>
                  {isGoogleSetup ? "Finish Setup" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* 🚀 Hide the Google button and Login link if we are in Step 2! */}
          {!isGoogleSetup && (
            <>
              {/* Divider */}
              <div className="lf-divider">or</div>

              {/* The Google Registration Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google signup failed. Please try again.')}
                  theme="outline"
                  size="large"
                  shape="pill"
                  text="signup_with"
                />
              </div>

              {/* Login link */}
              <p className="lf-signup">
                Already have an account?{' '}
                <Link to="/login">Sign in →</Link>
              </p>
            </>
          )}

        </div>
      </div>

    </div>
  );
}