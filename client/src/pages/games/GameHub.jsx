import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, Download, Play, Award, Shapes } from 'lucide-react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './GameHub.css'; 

export default function GameHub() {
  const [userName, setUserName] = useState('Student');
  const [gameStats, setGameStats] = useState([]);
  
  // Calculated Stats
  const [totalStars, setTotalStars] = useState(0);
  
  // Focus Match State
  const [focusMatchLevel, setFocusMatchLevel] = useState(1);
  const TOTAL_FOCUS_LEVELS = 4;

  // 👉 NEW: Shape Sort State
  const [shapeSortLevel, setShapeSortLevel] = useState(1);
  const TOTAL_SHAPE_LEVELS = 4;

  // 1. Load User & Fetch Stats on Mount
  useEffect(() => {
    const userString = localStorage.getItem('brightsteps_user');
    if (userString) {
      const user = JSON.parse(userString);
      setUserName(user.name || user.user?.name || 'Student');
      
      const id = user._id || user.user?.id;
      if (id) {
        fetchGameStats(id);
      }
    }
    
    // Check local storage for current level fallbacks
    const savedFocusLevel = localStorage.getItem('brightsteps_focus_unlocked');
    if (savedFocusLevel) setFocusMatchLevel(parseInt(savedFocusLevel));

    // 👉 NEW: Fallback for Shape Sort
    const savedShapeLevel = localStorage.getItem('brightsteps_shapes_unlocked');
    if (savedShapeLevel) setShapeSortLevel(parseInt(savedShapeLevel));
  }, []);

  // 2. Fetch Data from MongoDB
  const fetchGameStats = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/progress/${id}`);
      if (response.ok) {
        const data = await response.json();
        setGameStats(data);
        
        // Calculate Total Stars
        const stars = data.reduce((sum, game) => sum + (game.stars || 0), 0);
        setTotalStars(stars);

        // Find highest level played for Focus Match
        const focusGames = data.filter(g => g.gameName === "FocusMatch");
        if (focusGames.length > 0) {
          const maxLevel = Math.max(...focusGames.map(g => g.levelPlayed));
          setFocusMatchLevel(Math.min(maxLevel + 1, TOTAL_FOCUS_LEVELS)); 
        }

        // 👉 NEW: Find highest level played for Shape Sort
        const shapeGames = data.filter(g => g.gameName === "ShapeSort");
        if (shapeGames.length > 0) {
          const maxLevel = Math.max(...shapeGames.map(g => g.levelPlayed));
          setShapeSortLevel(Math.min(maxLevel + 1, TOTAL_SHAPE_LEVELS)); 
        }
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  // 3. Generate PDF Report
  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); 
    doc.text("Bright Steps - Student Game Report", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student Name: ${userName}`, 14, 30);
    doc.text(`Total Stars Earned: ${totalStars}`, 14, 38);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, 14, 46);

    const tableColumn = ["Date", "Game", "Level", "Stars", "Moves"];
    const tableRows = [];

    gameStats.forEach(stat => {
      const statData = [
        new Date(stat.date).toLocaleDateString(),
        stat.gameName,
        `Level ${stat.levelPlayed}`,
        `${stat.stars} Stars`,
        stat.totalMoves
      ];
      tableRows.push(statData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [116, 185, 255] } 
    });

    doc.save(`${userName}_Game_Report.pdf`);
  };

  // Calculate Progress Bar Widths
  const focusPercentage = (focusMatchLevel / TOTAL_FOCUS_LEVELS) * 100;
  
  // 👉 NEW: Calculate Shape Sort Progress
  const shapePercentage = (shapeSortLevel / TOTAL_SHAPE_LEVELS) * 100;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#666' }}>
          <ArrowLeft size={20} style={{ marginRight: '8px' }}/> Back to Dashboard
        </Link>
        <button 
          onClick={generatePDF}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: '#e8f4fd', color: '#2980b9', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Download size={18} style={{ marginRight: '8px' }} /> Download Report
        </button>
      </div>

      {/* Welcome & Global Stats */}
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#2d3436' }}>Hi, {userName}! 👋</h1>
          <p style={{ color: '#636e72', marginTop: '8px' }}>Ready to play and learn today?</p>
        </div>
        <div style={{ backgroundColor: '#fff3cd', padding: '15px 25px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
          <Star fill="#f1c40f" color="#f1c40f" size={32} style={{ marginRight: '10px' }} />
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d35400' }}>{totalStars}</div>
            <div style={{ fontSize: '12px', color: '#e67e22', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Stars</div>
          </div>
        </div>
      </div>

      <h2 style={{ color: '#2d3436', marginBottom: '1.5rem' }}>Your Games</h2>

      {/* Game Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* GAME 1: FOCUS MATCH */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '2px solid #e8f4fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#74b9ff', padding: '12px', borderRadius: '12px', color: 'white' }}>
              <Award size={32} />
            </div>
            <span style={{ backgroundColor: '#e8f4fd', color: '#0984e3', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              Memory & Focus
            </span>
          </div>
          
          <h3 style={{ margin: '0 0 8px 0', color: '#2d3436' }}>Focus Match</h3>
          <p style={{ color: '#636e72', fontSize: '14px', marginBottom: '1.5rem' }}>Find the matching pairs! Improves working memory and visual focus.</p>
          
          {/* Focus Match Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#636e72', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Level {focusMatchLevel}</span>
              <span>{Math.round(focusPercentage)}% Completed</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#f1f2f6', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${focusPercentage}%`, backgroundColor: '#55efc4', height: '100%', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

          <Link to="/games/focus-match" style={{ display: 'block', textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '12px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
              <Play size={18} style={{ marginRight: '8px' }} /> Play Now
            </button>
          </Link>
        </div>

        {/* GAME 2: SHAPE SORT */}
        <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '2px solid #f3e8fd' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#a29bfe', padding: '12px', borderRadius: '12px', color: 'white' }}>
              <Shapes size={32} />
            </div>
            <span style={{ backgroundColor: '#eef2fa', color: '#6c5ce7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              Motor Skills
            </span>
          </div>

           <h3 style={{ margin: '0 0 8px 0', color: '#2d3436' }}>Shape & Color Sort</h3>
           <p style={{ color: '#636e72', fontSize: '14px', marginBottom: '1.5rem' }}>Drag and drop to match shapes. Enhances motor skills and logic.</p>
           
           {/* 👉 NEW: Dynamic Shape Sort Progress Bar */}
           <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#636e72', marginBottom: '8px', fontWeight: 'bold' }}>
              <span>Level {shapeSortLevel}</span>
              <span>{Math.round(shapePercentage)}% Completed</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#f1f2f6', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${shapePercentage}%`, backgroundColor: '#a29bfe', height: '100%', borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
            </div>
          </div>

           <Link to="/games/shape-sort" style={{ display: 'block', textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '12px', backgroundColor: '#6c5ce7', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
              <Play size={18} style={{ marginRight: '8px' }} /> Play Now
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}