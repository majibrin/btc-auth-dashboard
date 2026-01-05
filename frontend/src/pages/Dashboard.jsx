import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {                                       TrendingUp, User, Settings, Shield, Bell,
  RefreshCw, BarChart3, LogOut, LayoutDashboard,
  ChevronRight, Info, Crown, Menu
} from 'lucide-react';

function Dashboard() {
  const [btcPrice, setBtcPrice] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);                                             const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // FIX: Define the Backend URL based on the environment
  const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://your-backend-api.vercel.app'; // <--- REPLACE THIS WITH YOUR ACTUAL BACKEND URL

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchBTCPrice();

    return () => window.removeEventListener('resize', checkMobile);
  }, [navigate]);

  const fetchBTCPrice = async () => {
    try {
      // FIX: Use the API_BASE variable here
      const res = await axios.get(`${API_BASE}/api/auth/btc-price`);
      setBtcPrice(res.data.price);
      
      // Update device/location info from backend if available
      if (res.data.userInfo) {
        setUser(prev => ({
          ...prev,
          device: res.data.userInfo.device,
          location: `${res.data.userInfo.city}, ${res.data.userInfo.country}`
        }));
      }
    } catch (err) {
      console.log('Failed to fetch BTC price');
      setBtcPrice('45,000.00');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatEmail = (email) => {
    if (!email) return '';
    if (isMobile && email.length > 20) {
      return email.substring(0, 18) + '...';
    }
    return email;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>
              <TrendingUp size={24} color="#f7931a" style={{marginRight: '8px'}} />
              BTC Dashboard
            </h1>
            {isMobile && (
              <button onClick={() => fetchBTCPrice()} style={styles.menuButton}>
                <Menu size={24} />
              </button>
            )}
          </div>

          <div style={styles.userSection}>
            <div style={styles.userInfo}>
              <div style={styles.userGreeting}>
                <span style={styles.welcomeText}>Welcome,</span>
                <strong style={styles.username}>
                  {isMobile && user?.username?.length > 10
                    ? user.username.substring(0, 8) + '...'
                    : user?.username}
                </strong>
              </div>
              <span style={{
                ...styles.roleBadge,
                backgroundColor: user?.role === 'admin' ? '#6f42c1' : '#007bff'
              }}>
                {user?.role}
              </span>
            </div>

            <div style={styles.buttonGroup}>
              {user?.role === 'admin' && (
                <button onClick={() => navigate('/admin')} style={styles.adminButton}>
                  <Crown size={16} style={{marginRight: isMobile ? 0 : '6px'}} />
                  {!isMobile && 'Admin'}
                </button>
              )}
              <button onClick={handleLogout} style={styles.logoutButton}>
                <LogOut size={16} style={{marginRight: isMobile ? 0 : '6px'}} />
                {!isMobile && 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.btcCard}>
          <div style={styles.btcHeader}>
            <h2 style={styles.btcTitle}>
              <BarChart3 size={20} style={{marginRight: '8px', verticalAlign: 'middle'}} />
              {isMobile ? 'BTC' : 'Bitcoin Price'}
            </h2>
            <span style={styles.btcBadge}>LIVE</span>
          </div>

          <div style={styles.priceContainer}>
            <span style={styles.currency}>$</span>
            <span style={styles.price}>
              {btcPrice ? btcPrice.replace(',', '') : '45,000.00'}
            </span>
            <span style={styles.currencyCode}>USD</span>
          </div>

          <p style={styles.btcSubtitle}>
            {isMobile ? 'Current BTC/USD' : 'Current BTC/USD market price'}
          </p>

          <div style={styles.btcActions}>
            <button onClick={fetchBTCPrice} style={styles.refreshButton}>
              <RefreshCw size={18} />
              {!isMobile && 'Refresh'}
            </button>
            <button onClick={() => alert('Price history coming soon!')} style={styles.historyButton}>
              <LayoutDashboard size={18} />
              {!isMobile && 'History'}
            </button>
          </div>

          {!isMobile && (
            <div style={styles.updateTime}>
              Updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          )}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <User size={18} style={{marginRight: '8px'}} />
              {isMobile ? 'Profile' : 'User Profile'}
            </h3>

            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Username</span>
                <span style={styles.infoValue}>{user?.username}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email</span>
                <span style={styles.emailText}>{formatEmail(user?.email)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Device</span>
                <span style={styles.infoValue}>{user?.device || 'Smartphone'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Location</span>
                <span style={styles.infoValue}>{user?.location || 'Nigeria'}</span>
              </div>
            </div>

            <button onClick={() => navigate('/profile')} style={styles.profileButton}>
              View Full Profile
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <RefreshCw size={18} style={{marginRight: '8px'}} />
              {isMobile ? 'Actions' : 'Quick Actions'}
            </h3>

            <div style={styles.actionsList}>
              <button onClick={() => navigate('/settings')} style={styles.actionButton}>
                <Settings size={18} /> {isMobile ? 'Settings' : 'Account Settings'}
              </button>
              <button onClick={() => alert('Security')} style={styles.actionButton}>
                <Shield size={18} /> {isMobile ? 'Security' : 'Security Settings'}
              </button>
              <button onClick={() => alert('Alerts')} style={styles.actionButton}>
                <Bell size={18} /> {isMobile ? 'Alerts' : 'Notifications'}
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <BarChart3 size={18} style={{marginRight: '8px'}} />
              {isMobile ? 'Stats' : 'Quick Stats'}
            </h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>24h Change</span>
                <span style={styles.statChangePositive}>+2.5%</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Market Cap</span>
                <span style={styles.statNumber}>$850B</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.infoSection}>
          <h3 style={styles.infoTitle}>
            <Info size={18} style={{marginRight: '8px'}} />
            {isMobile ? 'Info' : 'Dashboard Information'}
          </h3>
          <div style={styles.infoContent}>
            <p>• Real-time Bitcoin price updates every 30 seconds</p>
            <p>• Admin users can access user management panel</p>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          BTC Dashboard v1.0 {!isMobile && `• ${new Date().getFullYear()}`}
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
  minHeight: '100vh',
  backgroundColor: '#f4f7f9',
  fontFamily: 'system-ui, sans-serif',
  width: '100%',
  overflowX: 'hidden'
},
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  loadingSpinner: { width: '40px', height: '40px', border: '4px solid #ddd', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '1rem', position: 'sticky', top: 0, zIndex: 100 },
  headerContent: {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '0 15px',
  width: '100%',
  boxSizing: 'border-box'
},
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center' },
  menuButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' },
  userSection: { marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  username: { fontWeight: '600' },
  roleBadge: { padding: '2px 8px', borderRadius: '12px', color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase' },
  buttonGroup: { display: 'flex', gap: '8px' },
  adminButton: { padding: '8px 12px', backgroundColor: '#6f42c1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  logoutButton: { padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  main: {
  maxWidth: '1100px',
  margin: '20px auto',
  padding: '0 15px',
  width: '100%',
  boxSizing: 'border-box'
},
  btcCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #edf2f7', marginBottom: '20px' },
  btcHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btcBadge: { backgroundColor: '#e6fffa', color: '#38a169', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' },
  priceContainer: { display: 'flex', alignItems: 'baseline', gap: '4px', margin: '16px 0' },
  price: { fontSize: '2.5rem', fontWeight: '800', color: '#1a202c' },
  currency: { fontSize: '1.5rem', color: '#718096' },
  currencyCode: { color: '#718096', marginLeft: '8px' },
  btcActions: { display: 'flex', gap: '10px' },
  refreshButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  historyButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  grid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
  gap: '20px',
  width: '100%'
  },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #edf2f7' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f7fafc', paddingBottom: '10px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  infoItem: { display: 'flex', flexDirection: 'column' },
  infoLabel: { fontSize: '0.75rem', color: '#718096', marginBottom: '2px' },
  infoValue: { fontSize: '0.9rem', fontWeight: '600' },
  emailText: { fontSize: '0.85rem', wordBreak: 'break-all' },
  profileButton: { width: '100%', marginTop: '15px', padding: '10px', backgroundColor: '#f7fafc', border: '1px solid #edf2f7', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  actionsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  actionButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#fff', border: '1px solid #edf2f7', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statItem: { padding: '12px', backgroundColor: '#f7fafc', borderRadius: '8px', textAlign: 'center' },
  statChangePositive: { color: '#38a169', fontWeight: 'bold' },
  infoSection: { marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #edf2f7' },
  footer: { textAlign: 'center', padding: '40px 0', color: '#a0aec0', fontSize: '0.875rem' }
};

export default Dashboard;
