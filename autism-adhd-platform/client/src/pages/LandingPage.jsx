import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, LineChart, Calendar, Heart, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import './LandingPage.css';

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const CARDS = [
  {
    cls: 'fc-games',
    emoji: '🎮',
    Icon: Gamepad2,
    iconColor: 'white',
    num: '01',
    title: 'Fun, Calming Games',
    desc: 'Low-stimulation matching and pattern games that grow with your child — building focus and cognitive skills at their own pace, no pressure, no timers.',
    tags: ['Memory Match', 'Pattern Puzzles', 'Focus Training'],
    dataEmoji: '🎮',
  },
  {
    cls: 'fc-progress',
    emoji: '📈',
    Icon: LineChart,
    iconColor: 'white',
    num: '02',
    title: 'Visual Progress Reports',
    desc: 'Easy-to-read charts and star counts so parents and teachers can celebrate every milestone. Weekly summaries delivered automatically.',
    tags: ['Star Streaks', 'Weekly Reports', 'Skill Milestones'],
    dataEmoji: '📊',
  },
  {
    cls: 'fc-routine',
    emoji: '📅',
    Icon: Calendar,
    iconColor: 'white',
    num: '03',
    title: 'Predictable Daily Routines',
    desc: 'Structured, visual schedules with friendly icons reduce anxiety and build healthy habits. Children know what comes next — and feel confident about it.',
    tags: ['Morning Routine', 'Task Checklists', 'Visual Schedule'],
    dataEmoji: '📅',
  },
];

const STEPS = [
  {
    num: '1',
    emoji: '🏠',
    title: 'Set up your child\'s profile',
    desc: 'Add your child\'s name, favourite colours, and any preferences. Takes under 2 minutes.',
  },
  {
    num: '2',
    emoji: '📋',
    title: 'Build their daily routine',
    desc: 'Pick from pre-made schedule templates or create custom routines with drag-and-drop.',
  },
  {
    num: '3',
    emoji: '🚀',
    title: 'Let them learn & grow',
    desc: 'Your child follows their routine, plays focus games, and earns stars — you watch them shine.',
  },
];

/* ─────────────────────────────────────────
   HERO VISUAL — floating app preview cards
───────────────────────────────────────── */
function HeroVisual() {
  return (
    <div className="hero-right" aria-hidden="true">
      <div className="hv-stage">
        {/* Main task card */}
        <div className="hv-main">
          <div className="hv-main-header">
            <div className="hv-avatar">🐻</div>
            <div>
              <div className="hv-name">Jamie's Day</div>
              <div className="hv-day">Monday · 3 tasks left</div>
            </div>
          </div>
          <div className="hv-tasks">
            <div className="hv-task done">Brush teeth</div>
            <div className="hv-task done">Eat breakfast</div>
            <div className="hv-task active">Reading time</div>
            <div className="hv-task">Focus game</div>
          </div>
        </div>

        {/* Stars badge */}
        <div className="hv-stars">
          <div className="hv-stars-count">⭐ 14</div>
          <div className="hv-stars-label">stars this week!</div>
        </div>

        {/* Game progress card */}
        <div className="hv-game">
          <div className="hv-game-emoji">🧩</div>
          <div className="hv-game-title">Pattern Match — Level 4</div>
          <div className="hv-progress-bar">
            <div className="hv-progress-fill" />
          </div>
        </div>

        {/* Floating emojis */}
        <span className="hv-float f1">✨</span>
        <span className="hv-float f2">💛</span>
        <span className="hv-float f3">🌟</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   WAVE DIVIDER SVG
───────────────────────────────────────── */
function WaveDivider({ from = '#FEFCF5', to = '#FFF8EC', flip = false }) {
  return (
    <div className={`wave-divider${flip ? ' flip' : ''}`}>
      <svg viewBox="0 0 1400 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0,30 C180,60 320,0 500,28 C680,56 820,4 1000,30 C1180,56 1300,14 1400,30 L1400,60 L0,60 Z"
          fill={to}
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedBrightSteps');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      const t = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('hasVisitedBrightSteps', 'true');
      }, 2600);
      return () => clearTimeout(t);
    }
  }, []);

  /* ── SPLASH ── */
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-inner">
          <div className="splash-burst">
            <div className="splash-ring" />
            <div className="splash-ring" />
            <div className="splash-ring" />
            <span className="splash-emoji">✨</span>
          </div>
          <h1 className="splash-title">
            Bright<span>Steps</span>
          </h1>
          <p className="splash-sub">Every child can shine 🌟</p>
          <div className="splash-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ── */
  return (
    <div className="landing-container fade-in-page">

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="navbar">
        <a href="/" className="logo-lockup" aria-label="BrightSteps home">
          <div className="logo-badge">✨</div>
          <span className="logo-name">
            Bright<em>Steps</em>
          </span>
        </a>

        <div className="nav-right">
          <a
            href="#about"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >About</a>
          <Link to="/login" className="nav-cta">
            <Heart size={13} fill="white" color="white" />
            Parent / Teacher Login
          </Link>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero-section">

        <div className="hero-left">
          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <Sparkles size={13} />
            Designed for children with Autism &amp; ADHD
          </div>

          {/* H1 */}
          <h1 className="hero-h1">
            Learning that
            <span className="h1-line-2">
              fits{' '}
              <span className="h1-accent">every</span>
              {' '}child.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-sub">
            A calm, colourful platform that turns daily routines into
            adventures — with gentle games, visual schedules, and
            lots of stars for every step forward.
          </p>

          {/* Feature chips */}
          <div className="hero-chips">
            <span className="hchip hchip-sage">🌱 At their own pace</span>
            <span className="hchip hchip-rose">🎮 3 focus games</span>
            <span className="hchip hchip-sky">📊 Visual progress</span>
            <span className="hchip hchip-lav">🔒 Safe for all ages</span>
          </div>

          {/* CTA buttons */}
          <div className="hero-actions">
            <Link to="/login" className="btn-primary">
              Get Started — It's Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#how-it-works"
              className="btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              See how it works
            </a>
          </div>

          {/* Social trust */}
          <div className="hero-trust">
            <div className="trust-avatars">
              <span>👩</span><span>👨</span><span>👩‍🏫</span><span>👨‍⚕️</span>
            </div>
            Trusted by 500+ families &amp; educators
          </div>
        </div>

        {/* Right side — floating UI preview */}
        <HeroVisual />

      </section>

      {/* ══════════════════ WAVE TRANSITION ══════════════════ */}
      <WaveDivider from="#FEFCF5" to="#FFF8EC" />

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="features-section" id="about">
        <div className="section-tag">
          <CheckCircle2 size={13} /> Everything your child needs
        </div>
        <h2 className="section-title">Three pillars of bright learning</h2>
        <p className="section-sub">
          Every feature is designed around how neurodiverse children actually learn —
          predictable, calm, and full of positive reinforcement.
        </p>

        <div className="fcard-list">
          {CARDS.map((card) => (
            <div key={card.cls} className={`fcard ${card.cls}`} data-emoji={card.dataEmoji}>
              <div className="fcard-visual" data-emoji={card.dataEmoji}>
                <div className="fcard-icon">
                  <card.Icon size={30} color={card.iconColor} />
                </div>
                <span className="fcard-num">{card.num}</span>
              </div>
              <div className="fcard-body">
                <h3 className="fcard-title">{card.title}</h3>
                <p className="fcard-desc">{card.desc}</p>
                <div className="fcard-tags">
                  {card.tags.map(t => (
                    <span key={t} className="ftag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ WAVE TRANSITION ══════════════════ */}
      <WaveDivider from="#FFF8EC" to="#FEFCF5" />

      {/* ══════════════════ HOW IT WORKS ══════════════════ */}
      <section className="steps-section" id="how-it-works">
        <div className="section-tag">
          <Sparkles size={13} /> Simple to set up
        </div>
        <h2 className="section-title">Ready in minutes</h2>
        <p className="section-sub">
          No long setup, no confusing dashboards.
          Three steps and your child is learning.
        </p>

        <div className="steps-grid">
          {STEPS.map((step) => (
            <div key={step.num} className="step">
              <div className="step-num">{step.num}</div>
              <span className="step-emoji">{step.emoji}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ QUOTE BAND ══════════════════ */}
      <div className="quote-band">
        <p className="quote-text">
          "Every child learns differently —
          and that is{' '}
          <span className="quote-highlight">absolutely wonderful</span>."
        </p>
        <div className="quote-attr">
          No pressure. No timers. Just gentle encouragement, every step of the way.
        </div>
      </div>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="cta-section">
        <div className="cta-eyebrow">
          <span className="cta-dot" />
          No account needed to explore
        </div>

        <h2 className="cta-title">
          Ready to take the<br />first bright step?
        </h2>

        <p className="cta-sub">
          Free to start, safe for all ages, and built with love for
          every unique learner out there.
        </p>

        <div className="cta-btn-wrap">
          <span className="cta-corner c1">⭐</span>
          <span className="cta-corner c2">🌟</span>
          <span className="cta-corner c3">💛</span>
          <span className="cta-corner c4">✨</span>
          <Link to="/login" className="cta-btn">
            ✨ Start for Free Today
          </Link>
        </div>

        <p className="cta-fine">Safe for all ages · No credit card · Always free to explore</p>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <div className="wave-footer">
        <svg viewBox="0 0 1400 56" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,28 C200,56 400,0 600,28 C800,56 1000,4 1200,28 C1300,42 1360,18 1400,28 L1400,56 L0,56 Z"
            fill="#1E1007"
          />
        </svg>
      </div>
      <footer className="site-footer">
        <a href="/" className="footer-brand">
          <span className="footer-brand-dot" />
          BrightSteps
        </a>
        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>
        <p className="footer-copy">
          Made with ♥ for every bright little learner · © {new Date().getFullYear()}
        </p>
      </footer>

    </div>
  );
}