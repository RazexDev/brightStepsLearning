import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/games/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaders(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-col rank-1">🏆 1</span>;
    if (index === 1) return <span className="rank-col rank-2">🥈 2</span>;
    if (index === 2) return <span className="rank-col rank-3">🥉 3</span>;
    return <span className="rank-col">{index + 1}</span>;
  };

  if (loading) {
    return (
      <section className="leaderboard-section">
        <div className="leaderboard-empty">Loading top students...</div>
      </section>
    );
  }

  return (
    <section className="leaderboard-section">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">
          <span>🌟</span> Top Explorers Leaderboard
        </h2>
      </div>

      {leaders.length === 0 ? (
        <div className="leaderboard-empty">
          No game records yet. Start playing to get on the leaderboard!
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaders.map((student, index) => (
            <div key={student._id || index} className="leaderboard-row">
              {getRankBadge(index)}
              
              <div className="player-col">
                <div className="player-avatar">{student.avatar || '👧'}</div>
                <div className="player-name">
                  {student.name}
                  <span className="player-level">Level {student.level}</span>
                </div>
              </div>

              <div className="stats-col">
                <div className="stat-item">
                  <span className="stat-val">⭐ {student.totalStars}</span>
                  <span className="stat-label">Stars</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
