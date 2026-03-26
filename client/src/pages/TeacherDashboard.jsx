import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, LogOut, PlusCircle, BookOpen } from 'lucide-react'; 
import './ResourceManager.css'; 

export default function TeacherDashboard() {
  const navigate = useNavigate();
  
  // FIX: Combined the duplicate state declarations into one
  const [formData, setFormData] = useState({ 
    title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general' 
  });
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/resources');
      setResources(res.data);
    } catch (err) {
      console.error("Error fetching resources:", err);
    }
  };

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; 
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/resources', formData);
      if (res.status === 201 || res.status === 200) {
        alert("✨ Success! Resource saved.");
        // Reset form, keeping 'general' as the default target skill
        setFormData({ title: '', type: 'video', fileUrl: '', instructionalText: '', targetSkill: 'general' });
        fetchResources();
      }
    } catch (err) {
      console.error("Error saving resource:", err);
      alert("❌ Error: Could not save the resource.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this resource?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:5001/api/resources/${id}`);
        fetchResources(); 
      } catch (err) {
        console.error("Error deleting resource:", err);
        alert("❌ Failed to delete the resource.");
      }
    }
  };

  const handleLogout = () => {
    alert("This will log the teacher out once Auth is connected!");
    navigate('/'); 
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '50px' }}>
      <nav style={{ backgroundColor: '#fff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: 0, color: '#2d3436', display: 'flex', alignItems: 'center', gap: '10px' }}>
          👩‍🏫 Teacher Portal
        </h2>
        <button onClick={handleLogout} style={{ backgroundColor: '#ff7675', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <LogOut size={18} /> Log Out
        </button>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '40px' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#0984e3' }}>
            <PlusCircle size={24} /> Add New Learning Material
          </h3>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '20px' }} />
          
          <form className="resource-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            
            <div className="form-group">
              <label>Type</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="video">Video</option>
                <option value="pdf">PDF Document</option>
                <option value="link">Educational Link</option>
              </select>
            </div>

            {/* NEW: Target Skill Dropdown for the Recommendation Engine */}
            <div className="form-group">
              <label>Target Skill (For Recommendations)</label>
              <select value={formData.targetSkill} onChange={(e) => setFormData({...formData, targetSkill: e.target.value})}>
                <option value="general">General / Routine</option>
                <option value="focus">Focus & Attention (Brain Breaks)</option>
                <option value="calming">Calming & Winding Down</option>
                <option value="communication">Communication & Social Rules</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL (Link or File Path)</label>
              <input type="text" value={formData.fileUrl} onChange={(e) => setFormData({...formData, fileUrl: e.target.value})} required />
            </div>
            
            <div className="form-group">
              <label>Instructional Text (For Accessibility/TTS)</label>
              <textarea value={formData.instructionalText} onChange={(e) => setFormData({...formData, instructionalText: e.target.value})} required />
            </div>
            
            <button type="submit" className="add-btn">Save Resource</button>
          </form>
        </div>

        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#00b894' }}>
            <BookOpen size={24} /> Manage Active Resources
          </h3>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '20px' }} />
          
          <div className="resource-list">
            {resources.map(res => (
              <div key={res._id} className="resource-item" style={{ borderLeft: `5px solid ${res.type === 'video' ? '#ff7675' : res.type === 'pdf' ? '#74b9ff' : '#a29bfe'}` }}>
                
                {/* UPDATED: Displays the target skill badge next to the title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3>{res.title} <span style={{fontSize: '0.8rem', color: '#636e72', fontWeight: 'normal'}}>({res.type})</span></h3>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#eee', padding: '4px 8px', borderRadius: '10px', color: '#555' }}>
                    Skill: {res.targetSkill || 'general'}
                  </span>
                </div>

                <p style={{marginTop:'10px', fontSize:'0.9rem', color: '#2d3436'}}>{res.instructionalText}</p>
                
                {/* STRICT RULE: The Listen button ONLY renders if it's a PDF */}
                {res.type === 'pdf' && (
                  <button className="tts-btn" onClick={() => handleSpeak(res.instructionalText)}>
                     🔊 Listen to Instructions
                  </button>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <a href={res.fileUrl} target="_blank" rel="noreferrer" style={{color:'#0984e3', fontWeight:'700', textDecoration: 'none'}}>
                    Open Resource
                  </a>

                  <button 
                    onClick={() => handleDelete(res._id)}
                    style={{ backgroundColor: '#ff7675', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {resources.length === 0 && <p style={{textAlign: 'center', color: '#b2bec3'}}>No resources added yet.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}