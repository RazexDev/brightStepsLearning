import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './VideoModal.css';

export default function VideoModal({ url, onClose }) {
  // Prevent scrolling on the body ONLY while the modal is actually open
  useEffect(() => {
    if (!url) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [url]);

  if (!url) return null;

  // Helper to convert standard YouTube URLs to Embed URLs
  const getEmbedUrl = (rawUrl) => {
    try {
      const u = new URL(rawUrl);
      if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
        return `https://www.youtube.com/embed/${u.searchParams.get('v')}?autoplay=1`;
      } else if (u.hostname.includes('youtu.be')) {
        return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
      }
    } catch (e) {
      // Return raw URL if parsing fails
    }
    return rawUrl;
  };

  const embedUrl = getEmbedUrl(url);

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
          <iframe 
            src={embedUrl}
            className="react-player-vid"
            width="100%" 
            height="100%" 
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video Player"
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
          />
        </div>
      </div>
    </div>
  );
}
