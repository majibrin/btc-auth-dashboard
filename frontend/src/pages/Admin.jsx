import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

/**
 * Admin Component
 * Features: Search, Responsive View Toggle, Global State Management
 */
const Admin = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // 1. Authorization & Role Check
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return null;
    }

    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        navigate('/dashboard');
        return null;
      }
      return token;
    } catch (e) {
      navigate('/login');
      return null;
    }
  }, [navigate]);

  // 2. Data Fetching
  const fetchUsers = useCallback(async () => {
    const token = checkAuth();
    if (!token) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // We expect { success: true, users: [...] } from the updated backend
      setUsers(res.data.users || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
      console.error("Admin Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 3. Filtering Logic
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 4. Helper Functions
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString() : 'N/A';

  if (loading) return <div className="admin-loader">Loading User Database...</div>;

  return (
    <div className="admin-page-container">
      {/* Top Navigation Bar */}
      <nav className="admin-nav">
        <div className="nav-brand">
          <h1>Admin Control Panel</h1>
          <span className="user-count">Total: {users.length}</span>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-dash">User Dashboard</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      {/* Control Bar: Search & Refresh */}
      <div className="admin-controls">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search by username or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchUsers} className="btn-refresh">Refresh List</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <main className="admin-main">
        {/* VIEW 1: Desktop Table (Hidden on Mobile via CSS) */}
        <div className="desktop-view">
          <table className="user-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Location</th>
                <th>Device / OS</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="primary-text">{user.username}</div>
                    <div className="secondary-text">{user.email}</div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    {user.signupInfo?.city || 'Unknown'}, {user.signupInfo?.country || '??'}
                  </td>
                  <td>
                    <div className="device-info">{user.signupInfo?.device || 'Unknown'}</div>
                    <div className="os-info">{user.signupInfo?.os || 'Unknown'}</div>
                  </td>
                  <td>{formatDate(user.signupInfo?.signupDate)}</td>
                  <td>
                    <button onClick={() => setSelectedUser(user)} className="btn-details">View full log</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VIEW 2: Mobile Card List (Hidden on Desktop via CSS) */}
        <div className="mobile-view">
          {filteredUsers.map(user => (
            <div key={user._id} className="user-card" onClick={() => setSelectedUser(user)}>
              <div className="card-row">
                <span className="card-username">{user.username}</span>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </div>
              <div className="card-email">{user.email}</div>
              <div className="card-footer">
                <span>{user.signupInfo?.city || 'Unknown'}</span>
                <span>{user.signupInfo?.device || 'Mobile'}</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-body" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Security Profile: {selectedUser.username}</h2>
              <button className="close-x" onClick={() => setSelectedUser(null)}>&times;</button>
            </div>
            
            <div className="modal-grid">
              <section>
                <h3>Account Info</h3>
                <p><strong>ID:</strong> {selectedUser._id}</p>
                <p><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Banned'}</p>
                <p><strong>Registered:</strong> {formatDate(selectedUser.createdAt)}</p>
              </section>

              <section>
                <h3>Signup Metadata</h3>
                <p><strong>IP:</strong> {selectedUser.signupInfo?.ip}</p>
                <p><strong>Browser:</strong> {selectedUser.signupInfo?.browser}</p>
                <p><strong>OS:</strong> {selectedUser.signupInfo?.os}</p>
                <p><strong>Timezone:</strong> {selectedUser.signupInfo?.timezone}</p>
              </section>

              <section className="full-width">
                <h3>Last Login Summary</h3>
                <p><strong>Timestamp:</strong> {formatDate(selectedUser.lastLogin?.timestamp)}</p>
                <p><strong>IP:</strong> {selectedUser.lastLogin?.ip || 'N/A'}</p>
              </section>
            </div>
            
            <div className="modal-footer">
               <button className="btn-close" onClick={() => setSelectedUser(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
