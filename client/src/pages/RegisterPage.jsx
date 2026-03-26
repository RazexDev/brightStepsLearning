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
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
        body: JSON.stringify({ name, email, password, role, parentPin, googleToken }), 
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        const userToSave = data.user || data;
        localStorage.setItem('brightsteps_user', JSON.stringify(userToSave));
        navigate(role === 'teacher' ? '/teacher-dashboard' : '/dashboard');
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
        navigate(userToSave.role === 'teacher' ? '/teacher-dashboard' : '/dashboard');
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