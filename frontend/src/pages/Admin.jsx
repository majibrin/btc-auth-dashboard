
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.log('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ marginRight: '10px', padding: '8px 15px' }}
          >
            Dashboard
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none' }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>All Users ({users.length})</h2>
        <button 
          onClick={fetchUsers}
          style={{ marginBottom: '20px', padding: '8px 15px', background: '#007bff', color: 'white', border: 'none' }}
        >
          Refresh Users
        </button>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Location</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Device</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Signup Date</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{user.username}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: user.role === 'admin' ? '#6f42c1' : '#007bff',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.signupInfo?.country || 'Unknown'}
                    {user.signupInfo?.city && `, ${user.signupInfo.city}`}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>{user.signupInfo?.browser || 'Unknown'}</div>
                    <small style={{ color: '#6c757d' }}>{user.signupInfo?.os || 'Unknown'}</small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {user.signupInfo?.signupDate ? formatDate(user.signupInfo.signupDate) : 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => handleUserClick(user)}
                      style={{ padding: '6px 12px', marginRight: '5px', background: '#17a2b8', color: 'white', border: 'none' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>User Details: {selectedUser.username}</h2>
              <button 
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <h3>Basic Information</h3>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Account Created:</strong> {formatDate(selectedUser.createdAt)}</p>
              
              <h3 style={{ marginTop: '20px' }}>Signup Information</h3>
              <p><strong>IP Address:</strong> {selectedUser.signupInfo?.ip || 'Unknown'}</p>
              <p><strong>Location:</strong> {selectedUser.signupInfo?.city || 'Unknown'}, {selectedUser.signupInfo?.region || 'Unknown'}, {selectedUser.signupInfo?.country || 'Unknown'}</p>
              <p><strong>Browser:</strong> {selectedUser.signupInfo?.browser || 'Unknown'}</p>
              <p><strong>Operating System:</strong> {selectedUser.signupInfo?.os || 'Unknown'}</p>
              <p><strong>Device:</strong> {selectedUser.signupInfo?.device || 'Unknown'}</p>
              <p><strong>Signup Date:</strong> {selectedUser.signupInfo?.signupDate ? formatDate(selectedUser.signupInfo.signupDate) : 'N/A'}</p>
              
              {selectedUser.lastLogin && (
                <>
                  <h3 style={{ marginTop: '20px' }}>Last Login</h3>
                  <p><strong>Last Login IP:</strong> {selectedUser.lastLogin.ip || 'Unknown'}</p>
                  <p><strong>Last Login Time:</strong> {selectedUser.lastLogin.timestamp ? formatDate(selectedUser.lastLogin.timestamp) : 'Never'}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
