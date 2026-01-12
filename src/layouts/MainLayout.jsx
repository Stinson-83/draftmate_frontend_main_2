import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './MainLayout.css';
import smallLogo from '../assets/draftmate_logo.png';
import fullLogo from '../assets/FULL_LOGO.svg';

const MainLayout = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Force Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');

    const handleProfileUpdate = () => {
      const saved = localStorage.getItem('user_profile');
      if (saved) {
        // Update local state is managed internally for now
      }
    };

    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, []);

  // Initialize profile from storage or defaults
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: "Attorney Davis",
      email: "davis@draftmate.com",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf79wuBAV_uurpxIHNj8aieGbEhEXhNnnRbN4i6y6PB0cDQAIRL9j87KI1_P114LVgr1D83UM0cCNfd5rdo7Lgoukm2J7UpdQlshSXI1k296RyvODHng12-_Tgx2DvQBf07mko3b0GUnUqoofVCNHdDorsXylCZ2ZYcheYqOrU1fK68F4Io3yKaBeUc1s9moLHx_8V9HmPO4qleggBYJCVjxMsWblqTXMqk29SbcNjAAARdb2_y7Y7m6e7d39-tfL7WBs3YUvm84U"
    };
  });

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      const saved = localStorage.getItem('user_profile');
      if (saved) setUserProfile(JSON.parse(saved));
    };
    window.addEventListener('user_profile_updated', handleUpdate);
    return () => window.removeEventListener('user_profile_updated', handleUpdate);
  }, []);

  const isCollapsed = ['/dashboard/editor', '/dashboard/research', '/dashboard/pdf-editor'].some(path => location.pathname.startsWith(path));

  const NavItem = ({ to, icon, label }) => {
    const active = isActive(to);
    const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group";
    const activeClasses = "bg-primary/10 text-primary dark:text-blue-400";
    const inactiveClasses = "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";
    const iconClass = active ? "icon-fill" : "";
    const alignmentClasses = isCollapsed ? "justify-center px-0 w-8 h-8 mx-auto rounded-lg" : "";

    return (
      <Link to={to} className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${alignmentClasses}`} title={isCollapsed ? label : ''}>
        <span className={`material-symbols-outlined ${iconClass} ${isCollapsed ? 'text-xl' : ''}`}>{icon}</span>
        {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display antialiased overflow-hidden h-screen flex w-full">
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-12' : 'w-64'} bg-white dark:bg-[#151f2e] border-r border-slate-200 dark:border-slate-800 h-full flex-shrink-0 transition-all duration-300`}>
        <div className={`p-6 flex flex-col h-full ${isCollapsed ? 'px-0 py-4 items-center' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-3 px-2 mb-8 ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <img
              src={isCollapsed ? smallLogo : fullLogo}
              alt="DraftMate"
              className={`object-contain transition-all ${isCollapsed ? 'w-8 h-8' : 'h-12'}`}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 -mx-4 scrollbar-none flex flex-col gap-2 min-h-0">
            <div className="space-y-1">
              <NavItem to="/dashboard/home" icon="dashboard" label="Dashboard" />
              <NavItem to="/dashboard/tools" icon="build" label="Tools" />
              <NavItem to="/dashboard/drafts" icon="article" label="My Drafts" />
              <NavItem to="/dashboard/research" icon="balance" label="AI Research" />
              <NavItem to="/dashboard/settings" icon="settings" label="Settings" />
            </div>
          </nav>

          {/* Support & Utility */}
          <div className={`w-full pt-4 border-t border-slate-200 dark:border-slate-800 ${isCollapsed ? 'px-1' : ''}`}>
            <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col space-y-2' : 'px-2'}`}>
              <button
                className={`flex items-center justify-center p-2.5 rounded-lg transition-colors group text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${isCollapsed ? '' : 'flex-1'}`}
                title="Notifications"
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>

              <Link
                to="/dashboard/help"
                className={`flex items-center justify-center p-2.5 rounded-lg transition-colors group text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${isCollapsed ? '' : 'flex-1'}`}
                title="Help Center"
              >
                <span className="material-symbols-outlined text-xl">help</span>
              </Link>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className={`flex items-center justify-center p-2.5 rounded-lg transition-colors group text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 ${isCollapsed ? '' : 'flex-1'}`}
                title="Logout"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className={`w-full pt-4 ${isCollapsed ? '' : ''}`}>
            <Link
              to="/dashboard/settings"
              className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : ''}`}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600">
                  {userProfile?.image ? (
                    <img src={userProfile.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-medium">
                      {userProfile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#151f2e]"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userProfile?.name || 'Attorney Davis'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile?.email || 'View Profile'}</p>
                </div>
              )}
              {!isCollapsed && (
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              )}
            </Link>
          </div>
        </div>
      </aside >

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-background-light dark:bg-background-dark">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#151f2e] border-b border-slate-200 dark:border-slate-800 z-10">
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div></div>
          <div className="flex items-center gap-6">
            {location.pathname === '/dashboard/home' && (
              <>
                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[22px]">notifications</span>
                </button>
                <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  Help Center
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <Outlet />
      </main>
    </div >
  );
};

export default MainLayout;
