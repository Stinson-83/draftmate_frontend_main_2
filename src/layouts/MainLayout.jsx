import React, { useState, useEffect } from 'react';
import { Home, FileText, Scale, MessageSquare, Settings, LogOut } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Force Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Initialize profile from storage or defaults
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    // Fallback for legacy simple name storage
    const legacyName = localStorage.getItem('user_name');
    return {
      name: legacyName || 'Aaryan',
      role: '',
      workplace: '',
      image: null
    };
  });

  const [tempProfile, setTempProfile] = useState(userProfile);



  const handleProfileClick = () => {
    setTempProfile(userProfile);
    setSettingsMenuOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (tempProfile.name.trim()) {
      setUserProfile(tempProfile);
      localStorage.setItem('user_profile', JSON.stringify(tempProfile));
      setIsProfileModalOpen(false);
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header" style={{ justifyContent: userProfile.image ? 'center' : 'center' }}>
          {userProfile.image ? (
            <img
              src={userProfile.image}
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary)'
              }}
            />
          ) : (
            <div className="logo-icon">⚖️</div>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <Home size={20} />
            <span className="tooltip">Home</span>
          </Link>
          <Link to="/drafts" className={`nav-item ${isActive('/drafts') ? 'active' : ''}`}>
            <FileText size={20} />
            <span className="tooltip">My Drafts</span>
          </Link>
          <Link to="/research" className={`nav-item ${isActive('/research') ? 'active' : ''}`}>
            <Scale size={20} />
            <span className="tooltip">Research</span>
          </Link>
          <Link to="/chat" className={`nav-item ${isActive('/chat') ? 'active' : ''}`}>
            <MessageSquare size={20} />
            <span className="tooltip">Chat</span>
          </Link>
        </nav>

        <div className="sidebar-footer">


          <div style={{ position: 'relative' }}>
            <button
              className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
              onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
            >
              <Settings size={20} />
              <span className="tooltip">Settings</span>
            </button>

            {settingsMenuOpen && (
              <div className="settings-menu glass-panel" style={{
                position: 'absolute',
                bottom: '100%',
                left: '100%',
                marginLeft: '10px',
                marginBottom: '-40px',
                background: 'white',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '180px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 100
              }}>
                <button
                  onClick={handleProfileClick}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#333'
                  }}
                  onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  Personal Profile
                </button>
                <Link
                  to="/settings"
                  onClick={() => setSettingsMenuOpen(false)}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '14px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={e => e.target.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.target.style.background = 'transparent'}
                >
                  Document Settings
                </Link>
              </div>
            )}
          </div>

          <button className="nav-item">
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-area">
          {isActive('/') && (
            <header className="top-bar">
              <div className="user-welcome">
                <h1>Hi, {userProfile.name}!</h1>
                {(userProfile.role || userProfile.workplace) && (
                  <p className="user-subtitle" style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px' }}>
                    {userProfile.role && <span>{userProfile.role}</span>}
                    {userProfile.role && userProfile.workplace && <span> at </span>}
                    {userProfile.workplace && <span>{userProfile.workplace}</span>}
                  </p>
                )}
                <p className="date" style={{ marginTop: '4px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="brand-badge glass-panel">
                <FileText size={16} className="brand-icon" />
                <span>Law Jurist</span>
              </div>
            </header>
          )}
          <Outlet />
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
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
            padding: '24px',
            borderRadius: '12px',
            width: '450px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 600 }}>Personal Profile</h2>

            {/* Profile Picture Upload */}
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #e2e8f0'
              }}>
                {tempProfile.image ? (
                  <img src={tempProfile.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>👤</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label className="btn btn-sm btn-ghost" style={{ cursor: 'pointer', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px' }}>
                  Upload Picture
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                {tempProfile.image && (
                  <button
                    onClick={() => setTempProfile(prev => ({ ...prev, image: null }))}
                    className="btn btn-sm"
                    style={{
                      cursor: 'pointer',
                      border: '1px solid #fee2e2',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      color: '#ef4444',
                      background: '#fef2f2'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#666' }}>Full Name</label>
                <input
                  type="text"
                  value={tempProfile.name}
                  onChange={(e) => setTempProfile(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#666' }}>Role / Designation</label>
                <input
                  type="text"
                  value={tempProfile.role || ''}
                  onChange={(e) => setTempProfile(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                  placeholder="e.g. Senior Associate"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#666' }}>Current Workplace</label>
                <input
                  type="text"
                  value={tempProfile.workplace || ''}
                  onChange={(e) => setTempProfile(p => ({ ...p, workplace: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                  placeholder="e.g. Mahesh Kumar & Co."
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                style={{
                  padding: '8px 16px',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
