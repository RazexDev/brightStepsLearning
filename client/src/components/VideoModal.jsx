import React, { useEffect } from 'react';
import ReactPlayer from 'react-player';
import { X } from 'lucide-react';
import './VideoModal.css';

export default function VideoModal({ url, onClose }) {
  // Prevent scrolling on the body while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!url) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div 
        className="video-modal-content"
        onClick={(e) => e.stopPropagation()} // Prevent clicking the video from closing the modal
      >
        <button className="video-modal-close-btn" onClick={onClose}>
          <X size={18} /> Close Video
        </button>
        <div className="video-player-wrapper">
          <ReactPlayer 
            url={url} 
            className="react-player-vid"
            width="100%" 
            height="100%" 
            controls={true}
            playing={true}
          />
        </div>
      </div>
    </div>
  );
}
