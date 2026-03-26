import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ChatAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the childId exactly like we did for the games and the chatbot
  const userStr = localStorage.getItem('brightsteps_user');
  let childId = 'guest_player';
  if (userStr) {
    const user = JSON.parse(userStr);
    childId = user._id || user.user?.id || 'guest_player';
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/alerts/${childId}`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsResolved = async (alertId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        // Remove the resolved alert from the screen immediately
        setAlerts(prev => prev.filter(a => a._id !== alertId));
      }
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  };

  if (loading) return <div>Checking for safety alerts...</div>;
  
  if (alerts.length === 0) return (
    <div style={{ padding: '20px', background: '#dcfce7', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#166534' }}>
      <CheckCircle size={24} />
      <strong>All clear!</strong> No safety concerns detected in Sparky's chats.
    </div>
  );

  return (
    <div style={{ background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '12px', padding: '20px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b', marginTop: 0 }}>
        <AlertTriangle size={24} color="#ef4444" />
        AI Safety Alerts ({alerts.length})
      </h3>
      <p style={{ color: '#7f1d1d', fontSize: '14px' }}>
        Sparky flagged the following messages. Please review them.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alerts.map(alert => (
          <div key={alert._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#64748b' }}>
                {new Date(alert.timestamp).toLocaleString()}
              </p>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>
                "{alert.triggerMessage}"
              </p>
            </div>
            <button 
              onClick={() => markAsResolved(alert._id)}
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Mark Reviewed
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}