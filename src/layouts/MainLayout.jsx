import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import './MainLayout.css';

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
      email: "davis@lawjurist.com",
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
        <div className={`p-6 flex flex-col h-full justify-between ${isCollapsed ? 'px-0 py-4 items-center' : ''}`}>
          <div className="flex flex-col gap-8 w-full">
            {/* Logo */}
            <div className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center px-0' : ''}`}>
              <div className={`bg-primary aspect-square rounded-lg flex items-center justify-center text-white shrink-0 transition-all ${isCollapsed ? 'size-8 rounded-lg' : 'size-8'}`}>
                <span className={`material-symbols-outlined ${isCollapsed ? 'text-lg' : 'text-xl'}`}>gavel</span>
              </div>
              {!isCollapsed && <h1 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight whitespace-nowrap">Law Jurist</h1>}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 w-full">
              <NavItem to="/dashboard/home" icon="dashboard" label="Dashboard" />
              <NavItem to="/dashboard/tools" icon="handyman" label="Tools" />
              <NavItem to="/dashboard/drafts" icon="article" label="My Drafts" />

              <Link to="/dashboard/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors ${isCollapsed ? 'justify-center px-0 w-8 h-8 mx-auto rounded-lg' : ''}`} title={isCollapsed ? "Settings" : ""}>
                <span className={`material-symbols-outlined ${isCollapsed ? 'text-xl' : ''}`}>settings</span>
                {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
              </Link>
            </nav>
          </div>

          {/* Profile Footer */}
          <div className={`mt-auto w-full ${!isCollapsed && 'border-t border-slate-200 dark:border-slate-800 pt-4'}`}>
            <Link
              to="/dashboard/settings"
              className={`flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden ${isCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : ''}`}
            >
              <img
                src={userProfile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=0D8ABC&color=fff`}
                alt="Profile"
                className={`rounded-full shrink-0 object-cover ring-2 ring-white dark:ring-slate-700 ${isCollapsed ? 'size-8' : 'size-10'}`}
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=0D8ABC&color=fff`; }}
              />

              {!isCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {userProfile.name || 'Attorney Davis'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userProfile.email || 'View Profile'}
                  </p>
                </div>
              )}

              {!isCollapsed && (
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">
                  chevron_right
                </span>
              )}
            </Link>
          </div>
        </div>
      </aside>

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
    </div>
  );
};

export default MainLayout;
