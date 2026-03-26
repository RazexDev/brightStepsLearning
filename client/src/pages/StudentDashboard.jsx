import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Volume2, PlayCircle, FileText, ExternalLink, LogOut, Sparkles } from 'lucide-react';
import './ResourceManager.css'; 

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  
  // State to hold the dynamic recommendation data
  const [childMood, setChildMood] = useState('');
  const [targetSkill, setTargetSkill] = useState('');
  
  // NEW: State to display the active user's name in the UI
  const [studentName, setStudentName] = useState('Manishi');

  useEffect(() => {
    // 1. Check if the Tech Lead's Auth system has saved a user
    const storedUser = JSON.parse(localStorage.getItem('brightsteps_user'));
    
    // 2. The Fallback: Use the logged-in name, OR default to 'Manishi' for testing
    const activeName = storedUser?.name || 'Manishi';
    setStudentName(activeName);

    const fetchRecommendations = async () => {
      try {
        // 3. Dynamically inject the active name into the API URL
        const res = await axios.get(`http://localhost:5001/api/resources/recommend/${activeName}`);
        
        setResources(res.data.resources);
        setChildMood(res.data.childMood);
        setTargetSkill(res.data.skillTargeted);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };
    
    fetchRecommendations();
  }, []);

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; 
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Oops! Your browser doesn't support the Listen feature.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    navigate('/');
  };

  return (
    <div className="student-container" style={{ backgroundColor: '#fdfbfb', minHeight: '100vh', padding: '40px' }}>
      
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        
        {/* NEW: Dynamic Greeting using the active student's name */}
        <h1 className="splash-title" style={{ fontSize: '3rem', color: '#6C5CE7', margin: 0 }}>
          🌟 {studentName}'s Learning Hub 🌟
        </h1>
        
        <button onClick={handleLogout} className="tts-btn" style={{ backgroundColor: '#ef4444' }}>
          <LogOut size={18} style={{ marginRight: '8px' }} /> Log Out
        </button>
      </div>

      {/* Dynamic Recommendation Banner */}
      {childMood && (
        <div style={{ backgroundColor: '#ffeaa7', padding: '20px', borderRadius: '15px', textAlign: 'center', marginBottom: '40px', border: '3px dashed #fdcb6e' }}>
          <h2 style={{ color: '#d35400', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Sparkles size={24} />
            We see you are feeling {childMood}! Here are some great {targetSkill} activities for you.
          </h2>
        </div>
      )}

      {/* The Colorful Resource Grid */}
      <div className="student-grid">
        {resources.map((res) => (
          <div key={res._id} className={`student-card card-${res.type}`}>
            <div className="card-icon">
              {res.type === 'video' ? '📺' : res.type === 'pdf' ? '📖' : '🔗'}
            </div>
            
            <h2 style={{ fontFamily: 'Fredoka One, cursive', color: 'white', marginBottom: '15px' }}>
              {res.title}
            </h2>

            {/* STRICT RULE: Listen Button ONLY shows for PDFs */}
            {res.type === 'pdf' && (
              <button 
                className="action-btn" 
                onClick={() => handleSpeak(res.instructionalText)}
                style={{ width: '100%', marginBottom: '10px', backgroundColor: '#f6b93b', color: '#2d3436' }}
              >
                <Volume2 size={20} style={{ marginRight: '8px' }} /> Listen to Instructions
              </button>
            )}

            {/* Action Button to Open Content */}
            <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button className="action-btn" style={{ width: '100%', backgroundColor: '#333', color: 'white' }}>
                {res.type === 'video' ? <PlayCircle size={20} /> : res.type === 'pdf' ? <FileText size={20} /> : <ExternalLink size={20} />}
                <span style={{ marginLeft: '8px' }}>Start Learning</span>
              </button>
            </a>
          </div>
        ))}
        
        {resources.length === 0 && (
          <h3 style={{ textAlign: 'center', color: '#b2bec3', width: '100%' }}>
            No activities available right now. Let's play a game first!
          </h3>
        )}
      </div>
    </div>
  );
}