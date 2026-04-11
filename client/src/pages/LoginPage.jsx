import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google'; 
import { redirectByRole } from '../utils/auth';
import './LoginPage.css';

/* ─────────────────────────────────────────
   LEFT PANEL — brand / decorative side
───────────────────────────────────────── */
function LoginPanel() {
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
            Welcome<br />
            <span className="lp-hl-accent">back</span> — we<br />
            missed you! 👋
          </h2>
          <p className="lp-sub" style={{ marginTop: 14 }}>
            Your child's routines, progress, and games are waiting right where you left them.
          </p>
        </div>

        {/* Floating mini-cards */}
        <div className="lp-cards">
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-rose">🎮</div>
            <div className="lp-mc-text">
              <strong>Focus Games</strong>
              <span>Pattern Match · Memory · Puzzles</span>
            </div>
          </div>
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-amber">📅</div>
            <div className="lp-mc-text">
              <strong>Daily Routines</strong>
              <span>Visual schedules · Task checklists</span>
            </div>
          </div>
          <div className="lp-mini-card">
            <div className="lp-mc-icon i-sage">⭐</div>
            <div className="lp-mc-text">
              <strong>Progress &amp; Stars</strong>
              <span>Milestones · Weekly reports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom note */}
      <div className="lp-bottom">
        <span className="lp-dot" />
        Safe · Private · Built for every child's unique journey
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // 1. Standard Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        const loggedInUser = data.user || data;

        // Ensure studentId exists in the stored user object for legacy support
        if (loggedInUser.role === 'student' && !loggedInUser.studentId) {
          loggedInUser.studentId = loggedInUser._id || loggedInUser.id;
        }

        localStorage.setItem('brightsteps_user', JSON.stringify(loggedInUser));
        redirectByRole(loggedInUser.role, navigate);
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Cannot connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Login
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await response.json();
      
      // 🚀 THE BULLETPROOF LOCK: Stop new users from bypassing registration!
      if (data.isNewUser) {
        setError("Account not found. Please click 'Create one free' below to register first.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        localStorage.setItem('brightsteps_token', data.token);
        const loggedInUser = data.user || data;
        localStorage.setItem('brightsteps_user', JSON.stringify(loggedInUser));
        redirectByRole(loggedInUser.role, navigate);
      } else {
        setError(data.message || 'Google login failed.');
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
      <LoginPanel />

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
            <div className="lf-eyebrow">✨ Parent &amp; Teacher Portal</div>
            <h1 className="lf-title">Sign in to<br />BrightSteps</h1>
            <p className="lf-sub">
              Enter your details below to access your dashboard and see your child's bright progress.
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
          <form onSubmit={handleLogin}>
            <div className="lf-fields">

              {/* Email */}
              <div className="lf-field">
                <label className="lf-label" htmlFor="email">Email address</label>
                <div className="lf-input-wrap">
                  <span className="lf-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    className="lf-input"
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="lf-field">
                <label className="lf-label" htmlFor="password">Password</label>
                <div className="lf-input-wrap">
                  <span className="lf-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    className="lf-input"
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
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
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="lf-divider">or</div>

          {/* The Google Login Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google login failed. Please try again.')}
              useOneTap
              theme="outline"
              size="large"
              shape="pill"
            />
          </div>

          {/* Sign up link */}
          <p className="lf-signup">
            Don't have an account?{' '}
            <Link to="/register">Create one free →</Link>
          </p>

        </div>
      </div>

    </div>
  );
}