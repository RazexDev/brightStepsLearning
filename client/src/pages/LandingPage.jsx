import React from 'react';
import { Link } from 'react-router-dom';
// We don't need the external CSS file if we use these styles
// import './LandingPage.css'; 

export default function LandingPage() {
  return (
    <div style={fullScreenContainer}>
      
      {/* --- HERO SECTION --- */}
      <div style={{ maxWidth: '900px', width: '100%' }}>
        <h1 style={mainHeading}>
          Step-by-Step <br />
          Learning, <span style={{ color: 'var(--mint-deep)', textDecoration: 'underline', textDecorationColor: '#f6e05e' }}>Together.</span>
        </h1>
        
        <p style={subText}>
          A calm, colourful, and personalised platform built to support children
          with Autism & ADHD through structured daily routines and joyful activities.
        </p>

        {/* --- BUTTON --- */}
        <div style={{ marginTop: '40px', marginBottom: '60px' }}>
          <Link to="/dashboard">
            <button style={buttonStyle}>
              🚀 Go to Teacher Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* --- FEATURE CARDS SECTION --- */}
      <div style={gridContainer}>
        
        {/* Card 1 */}
        <div style={cardStyle}>
          <div style={{ ...iconCircle, backgroundColor: '#fffaf0' }}>🎮</div>
          <h3 style={cardHeading}>Fun Games</h3>
          <p style={cardText}>
            Low-stimulation, engaging matching and pattern games that build cognitive skills.
          </p>
        </div>

        {/* Card 2 */}
        <div style={cardStyle}>
          <div style={{ ...iconCircle, backgroundColor: '#ebf8ff' }}>📈</div>
          <h3 style={cardHeading}>Track Progress</h3>
          <p style={cardText}>
            Easy-to-read visual reports so parents and teachers can celebrate every milestone.
          </p>
        </div>

        {/* Card 3 */}
        <div style={cardStyle}>
          <div style={{ ...iconCircle, backgroundColor: '#f0fdfa' }}>🗓️</div>
          <h3 style={cardHeading}>Daily Routines</h3>
          <p style={cardText}>
            Structured, predictable schedules with friendly visuals to reduce anxiety.
          </p>
        </div>

      </div>
    </div>
  );
}

// --- 🎨 STYLES (Fixed for Perfect Centering) ---

const fullScreenContainer = {
  minHeight: '100vh',           /* Forces it to take full screen height */
  width: '100%',                /* Forces full width */
  display: 'flex',              /* Enables Flexbox */
  flexDirection: 'column',      /* Stacks items vertically */
  justifyContent: 'center',     /* Centers vertically */
  alignItems: 'center',         /* Centers horizontally */
  textAlign: 'center',
  padding: '40px',
  backgroundColor: '#f0fdfa',   /* Ensures background matches */
  fontFamily: 'Nunito, sans-serif'
};

const gridContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '30px',
  flexWrap: 'wrap',             /* Allows wrapping on small screens */
  width: '100%',
  maxWidth: '1200px'            /* Prevents it from getting too wide */
};

const mainHeading = {
  fontFamily: 'Fredoka One, cursive',
  fontSize: '3.5rem',
  color: '#2d3748',
  marginBottom: '20px',
  lineHeight: '1.2'
};

const subText = {
  fontSize: '1.2rem',
  color: '#4a5568',
  maxWidth: '700px',
  margin: '0 auto',             /* Centers the text block itself */
  lineHeight: '1.6'
};

const buttonStyle = {
  padding: '15px 30px',
  fontSize: '1.2rem',
  backgroundColor: 'var(--mint-deep)',
  color: 'white',
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  fontFamily: 'Fredoka One, cursive',
  boxShadow: '0 4px 15px rgba(79, 209, 197, 0.4)',
  transition: 'transform 0.2s ease'
};

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '32px',
  padding: '30px',
  width: '300px',
  minHeight: '320px',           /* Makes sure all cards are same height */
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  textAlign: 'center',
  borderBottom: '6px solid var(--mint-deep)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const iconCircle = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2rem',
  marginBottom: '20px'
};

const cardHeading = {
  fontFamily: 'Fredoka One, cursive',
  color: '#2d3748',
  fontSize: '1.4rem',
  marginBottom: '15px'
};

const cardText = {
  color: '#718096',
  fontSize: '0.95rem',
  lineHeight: '1.5'
};