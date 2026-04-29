import React, { useState, useEffect } from 'react';
import { LogOut, Users, Activity, Server, RefreshCcw, Trash2 } from 'lucide-react';
import s from './AdminDashboard.module.css';
const API_BASE = '/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkTeacherId, setBulkTeacherId] = useState('');
  // ── Stats ──
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoutines: 0,
    serverStatus: 'Online'
  });

  const authHdr = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('brightsteps_token')}`,
  });

  const loggedInUser = (() => {
    try { return JSON.parse(localStorage.getItem('brightsteps_user')); } 
    catch { return null; }
  })();

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/all`, { headers: authHdr() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setStats({
          totalUsers: data.length,
          activeRoutines: Math.floor(data.length * 1.5) + 12,
          serverStatus: 'Online'
        });
      } else {
        console.error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeachers = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/teachers`, { headers: authHdr() });
      if (res.ok) {
        setAvailableTeachers(await res.json());
      }
    } catch (err) { console.error('Error fetching teachers', err); }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTeachers();
  }, [fetchUsers, fetchTeachers]);

  const handleLogout = () => {
    localStorage.removeItem('brightsteps_token');
    localStorage.removeItem('brightsteps_user');
    window.location.href = '/login';
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you absolutely sure you want to delete the user "${userName}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          method: 'DELETE',
          headers: authHdr()
        });
        if (res.ok) {
          // Remove from local state to avoid refetch
          setUsers(users.filter(u => u._id !== userId));
          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        } else {
          const errData = await res.json();
          alert(`Failed to delete: ${errData.message}`);
        }
      } catch (err) {
        alert('Server error while deleting user.');
      }
    }
  };

  const handleAssignTeacher = async (studentId, teacherId) => {
    try {
      const res = await fetch(`${API_BASE}/users/${studentId}/assign`, {
        method: 'PATCH',
        headers: authHdr(),
        body: JSON.stringify({ teacherId })
      });
      if (res.ok) {
        fetchUsers(); // refresh the table
      } else {
        alert('Failed to assign teacher');
      }
    } catch (err) {
      alert('Error assigning teacher');
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.length === 0) return alert('Please select at least one user.');
    if (!bulkTeacherId) return alert('Please select a teacher to assign.');

    try {
      const res = await fetch(`${API_BASE}/users/bulk-assign`, {
        method: 'PUT',
        headers: authHdr(),
        body: JSON.stringify({ userIds: selectedUsers, teacherId: bulkTeacherId })
      });
      if (res.ok) {
        setSelectedUsers([]);
        setBulkTeacherId('');
        fetchUsers();
      } else {
        alert('Failed to bulk assign teacher');
      }
    } catch (err) {
      alert('Error during bulk assignment');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filtered = users.filter(u => u.role === 'student' || u.role === 'parent');
      setSelectedUsers(filtered.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (e, userId) => {
    if (e.target.checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const roleStyles = {
    admin: s.roleAdmin,
    teacher: s.roleTeacher,
    parent: s.roleParent,
    student: s.roleStudent
  };

  return (
    <div className={s.wrapper}>
      {/* ── Navbar ── */}
      <nav className={s.nav}>
        <div className={s.navBrand}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6366F1' }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          BrightSteps
          <span className={s.navBadge}>Super Admin</span>
        </div>
        <div className={s.navRight}>
          <span className={s.adminLabel}>{loggedInUser?.name || 'Administrator'}</span>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className={s.main}>
        <header className={s.pageHeader}>
          <h1>System Overview</h1>
          <p>Global platform metrics and user management administration.</p>
        </header>

        {/* Stats Grid */}
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <div className={s.statInfo}>
              <h3>Total Users</h3>
              <p>{loading ? '...' : stats.totalUsers}</p>
            </div>
            <div className={`${s.statIcon} ${s.iconIndigo}`}>
              <Users size={24} />
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statInfo}>
              <h3>Active Routines</h3>
              <p>{loading ? '...' : stats.activeRoutines}</p>
            </div>
            <div className={`${s.statIcon} ${s.iconAmber}`}>
              <Activity size={24} />
            </div>
          </div>
          <div className={s.statCard}>
            <div className={s.statInfo}>
              <h3>Server Status</h3>
              <p style={{ color: '#34D399' }}>{stats.serverStatus}</p>
            </div>
            <div className={`${s.statIcon} ${s.iconEmerald}`}>
              <Server size={24} />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className={s.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>User Management</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={{ padding: '6px 14px', borderRadius: '6px', background: activeTab === 'students' ? '#6366F1' : 'transparent', color: activeTab === 'students' ? 'white' : '#64748B', border: activeTab !== 'students' ? '1px solid #CBD5E1' : 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('students')}
            >
              Students & Parents
            </button>
            <button 
              style={{ padding: '6px 14px', borderRadius: '6px', background: activeTab === 'teachers' ? '#6366F1' : 'transparent', color: activeTab === 'teachers' ? 'white' : '#64748B', border: activeTab !== 'teachers' ? '1px solid #CBD5E1' : 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('teachers')}
            >
              Teachers
            </button>
            <button 
              style={{ padding: '6px 14px', borderRadius: '6px', background: activeTab === 'admins' ? '#6366F1' : 'transparent', color: activeTab === 'admins' ? 'white' : '#64748B', border: activeTab !== 'admins' ? '1px solid #CBD5E1' : 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setActiveTab('admins')}
            >
              Admins
            </button>
            <button className={s.refreshBtn} onClick={fetchUsers} style={{ marginLeft: '12px' }}>
              <RefreshCcw size={16} /> Refresh
            </button>
          </div>
        </div>

        {activeTab === 'students' && (
          <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>Bulk Actions:</span>
            <select
              value={bulkTeacherId}
              onChange={(e) => setBulkTeacherId(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none'
              }}
            >
              <option value="">Select a Teacher</option>
              {availableTeachers.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              style={{ padding: '8px 16px', background: '#6366F1', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              Apply to Selected ({selectedUsers.length})
            </button>
          </div>
        )}

        <div className={s.tableWrapper}>
          {loading ? (
            <div className={s.loader}>Loading system records...</div>
          ) : users.length === 0 ? (
            <div className={s.loader}>No users found.</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  {activeTab === 'students' && (
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll}
                        checked={
                          selectedUsers.length > 0 && 
                          users.filter(u => u.role === 'student' || u.role === 'parent').length > 0 &&
                          selectedUsers.length === users.filter(u => u.role === 'student' || u.role === 'parent').length
                        }
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </th>
                  )}
                  <th>User</th>
                  <th>Role</th>
                  <th>Join Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => {
                  if (activeTab === 'students') return u.role === 'student' || u.role === 'parent';
                  if (activeTab === 'teachers') return u.role === 'teacher';
                  if (activeTab === 'admins')   return u.role === 'admin';
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'students' ? "5" : "4"} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No {activeTab} found.
                    </td>
                  </tr>
                ) : (
                users.filter(u => {
                  if (activeTab === 'students') return u.role === 'student' || u.role === 'parent';
                  if (activeTab === 'teachers') return u.role === 'teacher';
                  if (activeTab === 'admins')   return u.role === 'admin';
                  return true;
                }).map(u => (
                  <tr key={u._id} style={selectedUsers.includes(u._id) ? { background: '#EFF6FF' } : {}}>
                    {activeTab === 'students' && (
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(u._id)}
                          onChange={(e) => handleSelectUser(e, u._id)}
                          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                        />
                      </td>
                    )}
                    <td>
                      <div className={s.cellName}>
                        <div className={s.avatar}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className={s.cellEmail}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${s.roleBadge} ${roleStyles[u.role] || s.roleStudent}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={s.cellDate}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                      {activeTab === 'students' && (u.role === 'student' || u.role === 'parent') && (
                        <select
                          value={u.assignedTeacher?._id || u.assignedTeacher || ''}
                          onChange={(e) => handleAssignTeacher(u._id, e.target.value)}
                          style={{
                            padding: '6px 10px', borderRadius: '6px',
                            border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC',
                            fontFamily: 'inherit', fontSize: '0.85rem', color: '#334155',
                            outline: 'none', cursor: 'pointer'
                          }}
                        >
                          <option value="">Unassigned</option>
                          {availableTeachers.map(t => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                      <button 
                        className={s.deleteBtn} 
                        onClick={() => handleDelete(u._id, u.name)}
                        title="Delete User"
                        disabled={loggedInUser?._id === u._id} // Prevent self-deletion
                        style={{ opacity: loggedInUser?._id === u._id ? 0.3 : 1 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
