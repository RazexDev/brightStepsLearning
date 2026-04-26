// Import React hooks for state and lifecycle management
import React, { useState, useEffect } from 'react';

// Import Link for navigation between pages
import { Link } from 'react-router-dom';

// Axios is used to communicate with backend APIs
import axios from 'axios';

// Import icons for UI
import { ArrowLeft, ExternalLink, LogOut, FileText, Volume2 } from 'lucide-react';

// Import CSS styling
import './ResourceManager.css';

// Import VideoModal
import VideoModal from '../components/VideoModal';


// Mapping resource types to emojis for UI display
const TYPE_EMOJI = { video: '🎬', pdf: '📄', link: '🔗', offline: '🌳' };

// Mapping resource types to readable labels
const TYPE_LABEL = { video: 'Video', pdf: 'PDF Document', link: 'Educational Link', offline: 'Offline Activity' };


// Main component
export default function ResourceManager() {

  // State to store all resources
  const [resources, setResources] = useState([]);

  // State to store current student's name
  const [studentName, setStudentName] = useState('Student');

  // State to track student's level
  const [currentLevel, setCurrentLevel] = useState(0);

  // State to track progress percentage
  const [progressPct, setProgressPct] = useState(0);

  // State for next goal message
  const [nextGoal, setNextGoal] = useState('');

  // State to control offline modal visibility
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  // Store selected offline resource
  const [selectedOfflineResource, setSelectedOfflineResource] = useState(null);

  // State to control video modal visibility
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);


  // Function to log progress when user completes a resource
  const logProgressAndRefresh = async (activityTitle, type) => {
    try {
      // Send progress data to backend
      await axios.post('/api/progress', {
        studentName,
        date: new Date(),
        activity: activityTitle,
        mood: 'Happy',
        notes: `Completed ${type} Resource: ${activityTitle}`,
        stars: 2,
        totalMoves: 0,
        completionTime: 0,
        gameName: 'Learning Material'
      });

      // Fetch updated progress and resources
      const res = await axios.get(`/api/resources/recommend/${encodeURIComponent(studentName)}`);

      const newLevel = res.data.currentLevel || 0;
      const newPct = res.data.progressPct || 0;

      // If level increased → show animation effect
      if (newLevel > currentLevel) {
        setProgressPct(100); // temporarily fill bar

        setTimeout(() => {
          setCurrentLevel(newLevel);
          setProgressPct(newPct);
          setNextGoal(res.data.nextGoal || '');
          setResources(res.data.resources || []);
        }, 800);
      } else {
        // Normal update
        setCurrentLevel(newLevel);
        setProgressPct(newPct);
        setNextGoal(res.data.nextGoal || '');
        setResources(res.data.resources || []);
      }

    } catch (err) {
      console.error('Error logging progress:', err);
    }
  };


  // useEffect runs when component loads
  useEffect(() => {

    // Get logged-in user from localStorage
    const storedUser = JSON.parse(localStorage.getItem('brightsteps_user'));

    const activeName = storedUser?.name || 'Student';

    setStudentName(activeName);

    // Function to fetch resources from backend
    const fetchResources = async () => {
      try {
        const res = await axios.get(`/api/resources/recommend/${encodeURIComponent(activeName)}`);

        // Update states with API response
        setResources(res.data.resources || []);
        setCurrentLevel(res.data.currentLevel || 0);
        setProgressPct(res.data.progressPct || 0);
        setNextGoal(res.data.nextGoal || '');

      } catch (err) {
        console.error('Error fetching resources:', err);
      }
    };

    fetchResources();

  }, []); // runs only once when component mounts


  // Function to read text aloud (Text-to-Speech)
  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop previous speech

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 0.9; // slow speed for better understanding

      window.speechSynthesis.speak(utterance);
    }
  };


  // JSX UI rendering
  return (
    <div className="resource-manager">

      {/* Header Section */}
      <div className="rm-hero">

        {/* Navigation Buttons */}
        <div className="rm-nav">
          <Link to="/dashboard" className="back-to-dash">
            <ArrowLeft size={18} /> Back
          </Link>

          <Link
            to="/login"
            className="logout-btn"
            onClick={() => localStorage.clear()} // clear session
          >
            <LogOut size={16} /> Log Out
          </Link>
        </div>

        {/* Title Section */}
        <div className="hero-title-block">
          <span className="hero-emoji-big">📚</span>
          <h1 className="hub-title">Available Resources</h1>
          <p className="hub-subtitle">Explore learning materials made just for you!</p>
        </div>
      </div>


      {/* Main Content */}
      <div className="rm-content">

        {/* Progress Bar Section */}
        <div className="progression-banner">
          <div className="level-badge">
            ⭐ Level {currentLevel}
          </div>

          {/* Progress bar */}
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          {/* Next goal */}
          <div style={{ fontWeight: 800, color: 'var(--ink-mid)' }}>
            ✨ {nextGoal}
          </div>
        </div>


        {/* Resource List */}
        <div className="resource-list">

          {resources.map((res) => (

            <div key={res._id} className={`resource-item card-${res.type}`} data-emoji={TYPE_EMOJI[res.type]}>

              <div className="resource-item-inner">

                {/* Type Badge */}
                <div className="type-badge">
                  {TYPE_EMOJI[res.type]} {TYPE_LABEL[res.type]}
                </div>

                {/* Title */}
                <h3>{res.title}</h3>

                {/* Instructions */}
                <div className="instructions-text">
                  🗒️ {res.instructionalText}
                </div>

              </div>

              {/* Actions */}
              <div className="card-actions">

                {/* Text-to-Speech button for PDFs */}
                {res.type === 'pdf' && (
                  <button className="action-btn" onClick={() => handleSpeak(res.instructionalText)}>
                    <Volume2 size={18} /> Listen
                  </button>
                )}

                {/* Offline resource modal */}
                {res.type === 'offline' ? (
                  <button
                    className="action-btn"
                    onClick={() => {
                      setSelectedOfflineResource(res);
                      setShowOfflineModal(true);
                    }}
                  >
                    <FileText size={18} /> View Instructions
                  </button>

                ) : res.fileUrl ? (

                  // Open link resource
                  res.type === 'video' ? (
                    <button
                      className="action-btn"
                      onClick={() => {
                        logProgressAndRefresh(res.title, TYPE_LABEL[res.type]);
                        setActiveVideoUrl(res.fileUrl);
                      }}
                    >
                      <ExternalLink size={18} /> Watch
                    </button>
                  ) : (
                    <a
                      className="action-btn"
                      href={res.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => logProgressAndRefresh(res.title, TYPE_LABEL[res.type])}
                    >
                      <ExternalLink size={18} /> Open
                    </a>
                  )

                ) : null}

              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Offline Modal */}
      {showOfflineModal && selectedOfflineResource && (
        <div className="modal-overlay">
          <div className="modal">

            <h2>{selectedOfflineResource.title}</h2>

            {/* Show instructions */}
            <p style={{ fontSize: '1.1rem', color: 'var(--ink-mid)', marginBottom: '24px', lineHeight: 1.6 }}>
              {selectedOfflineResource.offlineInstructions}
            </p>

            {/* Complete button */}
            <button
              className="action-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={async () => {
                await logProgressAndRefresh(selectedOfflineResource.title, 'Offline Activity');
                setShowOfflineModal(false);
                setSelectedOfflineResource(null);
              }}
            >
              ✅ I Completed It!
            </button>
            <button
              style={{ marginTop: '12px', background: 'transparent', border: 'none', color: 'var(--ink-soft)', fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => {
                setShowOfflineModal(false);
                setSelectedOfflineResource(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      <VideoModal 
        url={activeVideoUrl} 
        onClose={() => setActiveVideoUrl(null)} 
      />

    </div>
  );
}