import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gamepad2, LineChart, Calendar, Heart} from 'lucide-react';
import './LandingPage.css';

/* 14 emoji bubbles for infinity background */
const BUBBLES = [
  '⭐','🌟','✨','🎈','🌈','🦋',
  '🌸','🍀','💛','🎵','🚀','☁️','🌙','💫',
];

const CARDS = [
  {
    cls:       'card-games',
    emoji:     '🎮',
    Icon:      Gamepad2,
    iconColor: '#f4956a',
    title:     '🎮 Fun Games',
    desc:      'Low-stimulation, engaging matching and pattern games that build cognitive skills at every child\'s own pace.',
    tags:      ['Memory', 'Puzzles', 'Focus Match'],
  },
  {
    cls:       'card-progress',
    emoji:     '📈',
    Icon:      LineChart,
    iconColor: '#38bdf8',
    title:     '📈 Track Progress',
    desc:      'Easy-to-read visual reports so parents and teachers can celebrate every milestone and monitor growth.',
    tags:      ['Stars', 'Reports', 'Milestones'],
  },
  {
    cls:       'card-routine',
    emoji:     '📅',
    Icon:      Calendar,
    iconColor: '#4ade80',
    title:     '📅 Daily Routines',
    desc:      'Structured, predictable schedules with friendly visuals to reduce anxiety and build healthy daily habits.',
    tags:      ['Schedule', 'Activities', 'Daily Tasks'],
  },
];

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

  /* ── SPLASH ── */
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <Sparkles size={92} color="#f4956a" className="splash-icon-anim" />
          <h1 className="splash-title">BrightSteps</h1>
          <p className="splash-tagline">Learning made joyful ✨</p>
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ── */
  return (
    <div className="landing-container fade-in-page">

      {/* ══════════════════════════════
          INFINITY FLOATING BACKGROUND
      ══════════════════════════════ */}
      <div className="landing-bg" aria-hidden="true">
        {BUBBLES.map((emoji, i) => (
          <span key={i} className={`lbubble lb${i + 1}`}>{emoji}</span>
        ))}
      </div>

      {/* ══════════════════════════════
          NAVBAR — glassmorphic sticky
      ══════════════════════════════ */}
      <nav className="navbar">
        <div className="logo-text">
          <Sparkles size={26} color="#f4956a" className="logo-icon" />
          BrightSteps
        </div>

        <Link to="/login" className="login-btn">
          <Heart size={14} fill="white" color="white" />
          Teacher / Parent Login
        </Link>
      </nav>

      {/* ══════════════════════════════
          HERO SECTION
      ══════════════════════════════ */}
      <header className="hero-section">

        {/* decorative blobs */}
        <div className="hero-deco hd1" aria-hidden="true" />
        <div className="hero-deco hd2" aria-hidden="true" />
        <div className="hero-deco hd3" aria-hidden="true" />

        {/* bouncing emoji row */}
        <div className="hero-emoji-row" aria-hidden="true">
          <span>🧠</span>
          <span>🌟</span>
          <span>🎯</span>
          <span>🚀</span>
          <span>💛</span>
        </div>

        {/* friendly badge */}
        <div className="hero-badge animate-slide-up">
          <Heart size={14} fill="#5ecfba" color="#5ecfba" />
          Designed for every child's unique journey
        </div>

        {/* title — three coloured pill highlights */}
        <h1 className="hero-title animate-slide-up delay-1">
          <span className="ht-mint">Step-by-Step</span>{' '}
          <span className="ht-peach">Learning</span>,{' '}
          <span className="ht-sky">Together</span>.
        </h1>

        <p className="hero-subtitle animate-slide-up delay-2">
          A calm, colourful, and personalised platform built to support
          children with Autism &amp; ADHD through structured daily routines
          and joyful, low-stimulation activities.
        </p>

        {/* info pills */}
        <div className="hero-pills animate-slide-up delay-2">
          <span className="hero-pill hp-green">🌱 At every child's own pace</span>
          <span className="hero-pill hp-peach">🎮 3 fun games ready</span>
          <span className="hero-pill hp-sky">📊 Visual progress reports</span>
          <span className="hero-pill hp-lav">🔒 Safe for all ages</span>
        </div>

        {/* ── FEATURE CARDS ── */}
        <div className="features-grid animate-slide-up delay-3">
          {CARDS.map((card) => (
            <div
              key={card.cls}
              className={`feature-card ${card.cls}`}
              data-emoji={card.emoji}
            >
              <div className="icon-wrapper">
                <card.Icon size={34} color={card.iconColor} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <div className="card-tags">
                {card.tags.map(t => (
                  <span key={t} className="ctag">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA BUTTONS ── */}
        <div className="cta-section animate-slide-up delay-4">
          <Link to="/login" className="cta-btn">
            ✨ Get Started — It's Free
          </Link>
          <p className="cta-note">
            <span className="cta-dot" />
            No account needed to explore &nbsp;·&nbsp; Safe for all ages
          </p>
        </div>

      </header>

      {/* ══════════════════════════════
          ENCOURAGEMENT BANNER
      ══════════════════════════════ */}
      <div className="encourage-banner">
        <div className="eb-inner">
          <span className="eb-emoji">🌈</span>
          <div className="eb-text">
            <h3>Every child learns differently — and that's wonderful!</h3>
            <p>
              BrightSteps meets every learner exactly where they are.
              No pressure, no timers — just gentle guidance, colourful visuals,
              and lots of encouragement every step of the way. ✨
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          FOOTER WAVE + FOOTER
      ══════════════════════════════ */}
      <div className="footer-wave">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
            fill="#1e293b"
          />
        </svg>
      </div>

      <footer className="site-footer">
        <span className="ft-brand">
          <Sparkles size={14} color="#5ecfba" style={{ display:'inline', verticalAlign:'middle', marginRight:5 }} />
          BrightSteps
        </span>
        <span className="ft-divider">·</span>
        <span>Made with ♥ for every bright little learner</span>
        <span className="ft-divider">·</span>
        <span>© {new Date().getFullYear()} All rights reserved</span>
      </footer>

    </div>
  );
}