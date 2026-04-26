import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import './SparkyBot.css';

export default function SparkyBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const lastCheerTime = useRef(0); // 👈 The lock timer
  const location = useLocation();

  // 1. Get User Data
  const getUserData = () => {
    const userStr = localStorage.getItem('brightsteps_user');
    if (!userStr) return { id: 'guest_player', name: 'Friend' };
    try {
      const user = JSON.parse(userStr);
      const id = user._id || user.id || user.user?._id || user.user?.id || 'guest_player';
      const name = user.name ? user.name.split(' ')[0] : 'Friend';
      return { id, name };
    } catch {
      return { id: 'guest_player', name: 'Friend' };
    }
  };

  const { id: childId, name: childName } = getUserData();

  // 2. Set the personalized greeting when Sparky loads
  useEffect(() => {
    setMessages([
      { sender: 'sparky', text: `Hi ${childName}! I'm Sparky! 🌟 I'm so excited to play and learn with you today. What's on your mind?` }
    ]);
  }, [childName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // 3. The Walkie-Talkie Listener for Game Wins
  useEffect(() => {
    const handleGameWin = async (e) => {
      // 👇 THE COOLDOWN LOCK: Prevent duplicate cheers within 5 seconds
      const now = Date.now();
      if (now - lastCheerTime.current < 5000) {
        console.log("Sparky ignored a duplicate cheer request.");
        return; 
      }
      lastCheerTime.current = now; // Lock it down!

      const { gameName } = e.detail;
      
      setIsOpen(true);
      setIsLoading(true);

      try {
        const secretPrompt = `[SYSTEM ALERT]: I just successfully completed the learning game "${gameName}"! Tell me how proud you are of me in 1 super enthusiastic sentence using emojis!`;
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId, childName, message: secretPrompt }) 
        });

        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'sparky', text: data.reply }]);

      } catch (error) {
        setMessages(prev => [...prev, { sender: 'sparky', text: `Woohoo! Amazing job finishing ${gameName}, ${childName}! 🎉 You are a star!` }]);
      } finally {
        setIsLoading(false);
      }
    };

    window.addEventListener('sparky-cheer', handleGameWin);
    return () => window.removeEventListener('sparky-cheer', handleGameWin);
  }, [childId, childName]);

  // 4. Hide Sparky on Login/Register
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
    return null; 
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, childName, message: userMessage }) 
      });

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'sparky', text: data.reply }]);

    } catch (error) {
      setMessages(prev => [...prev, { sender: 'sparky', text: "Oops! My brain got a little tangled. 🧶 Let's try that again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="sparky-fab" onClick={() => setIsOpen(true)}>
          <span className="sparky-avatar">🐶</span>
        </div>
      )}

      {isOpen && (
        <div className="sparky-window">
          <div className="sparky-header">
            <div className="sparky-header-info">
              <span className="sparky-avatar" style={{ fontSize: '24px' }}>🐶</span>
              <div>
                <h3>Sparky</h3>
                <p>Your Learning Buddy</p>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="sparky-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`msg-bubble ${msg.sender === 'sparky' ? 'msg-sparky' : 'msg-user'}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="typing-indicator">Sparky is thinking... 🤔</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="sparky-input-area">
            <input 
              type="text" 
              placeholder={`Message Sparky, ${childName}...`} 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              maxLength={150}
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}