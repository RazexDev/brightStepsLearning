import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gamepad2, LineChart, Calendar, Heart } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedBrightSteps');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hasVisitedBrightSteps', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ── SPLASH ─────────────────────────────── */
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <Sparkles size={90} color="#f4956a" className="splash-icon-anim" />
          <h1 className="splash-title">BrightSteps</h1>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ───────────────────────────── */
  return (
    <div className="landing-container fade-in-page">

      {/* NAV */}
      <nav className="navbar">
        <div className="logo-text">
          <Sparkles size={26} color="#f4956a" className="logo-icon" />
          BrightSteps
        </div>
        
        {/* THIS IS THE LINK THAT ROUTES TO YOUR LOGIN PAGE */}
        <Link to="/login" className="login-btn">
          Teacher / Parent Login
        </Link>
      </nav>

      {/* HERO */}
      <header className="hero-section">

        {/* Friendly badge */}
        <div className="hero-badge animate-slide-up">
          <Heart size={14} fill="#5ecfba" color="#5ecfba" />
          Designed for every child's unique journey
        </div>

        <h1 className="hero-title animate-slide-up delay-1">
          Step-by-Step Learning,{' '}
          <span className="highlight">Together</span>.
        </h1>

        <p className="hero-subtitle animate-slide-up delay-2">
          A calm, colourful, and personalised platform built to support
          children with Autism &amp; ADHD through structured daily routines
          and joyful activities.
        </p>

        {/* CARDS */}
        <div className="features-grid animate-slide-up delay-3">

          <div className="feature-card card-games">
            <div className="icon-wrapper" style={{ backgroundColor: '#ffecd9' }}>
              <Gamepad2 size={34} color="#f4956a" />
            </div>
            <h3>Fun Games</h3>
            <p>Low-stimulation, engaging matching and pattern games that build cognitive skills at every child's own pace.</p>
          </div>

          <div className="feature-card card-progress">
            <div className="icon-wrapper" style={{ backgroundColor: '#ddf0fc' }}>
              <LineChart size={34} color="#38bdf8" />
            </div>
            <h3>Track Progress</h3>
            <p>Easy-to-read visual reports so parents and teachers can celebrate every milestone and monitor growth.</p>
          </div>

          <div className="feature-card card-routine">
            <div className="icon-wrapper" style={{ backgroundColor: '#dcfce7' }}>
              <Calendar size={34} color="#4ade80" />
            </div>
            <h3>Daily Routines</h3>
            <p>Structured, predictable schedules with friendly visuals to reduce anxiety and build healthy daily habits.</p>
          </div>

        </div>

        {/* CTA */}
        <div className="cta-section animate-slide-up delay-4">
          {/* THIS ALSO ROUTES TO YOUR LOGIN PAGE */}
          <Link to="/login" className="cta-btn">
            ✨ Get Started — It's Free
          </Link>
          <p className="cta-note">No account needed to explore · Safe for all ages</p>
        </div>

      </header>

      {/* WAVE + FOOTER */}
      <div className="footer-wave">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
            fill="#2d3a4a"
          />
        </svg>
      </div>

      <footer className="site-footer">
        Made with <span>♥</span> for every bright little learner · © {new Date().getFullYear()} BrightSteps
      </footer>

    </div>
  );
}