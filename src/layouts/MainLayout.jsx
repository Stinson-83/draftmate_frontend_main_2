import React, { useState, useEffect } from 'react';
import { Home, FileText, Scale, MessageSquare, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="layout-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-icon">⚖️</div>
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
          <button className="nav-item theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="tooltip">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
            <Settings size={20} />
          </Link>
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
                <h1>Hi, Aaryan!</h1>
                <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
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
    </div>
  );
};

export default MainLayout;
