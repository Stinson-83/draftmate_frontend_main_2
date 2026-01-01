import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import PDFEditor from './pages/PDFEditor';
import MyDrafts from './pages/MyDrafts';

import ResearchChat from './pages/ResearchChat';
import Tools from './pages/Tools';

import Settings from './pages/Settings';

// Placeholder for other routes
const Placeholder = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <h2>{title}</h2>
    <p>This feature is coming soon.</p>
  </div>
);

  if (!import.meta.env.VITE_CLIENT_ID) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 text-red-800 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
          <p>
            <code>VITE_CLIENT_ID</code> is missing from environment variables.
          </p>
          <p className="text-sm mt-2 text-red-600">
            Please check your <code>.env</code> file and ensure the variable is set and passed to Docker.
          </p>
        </div>
      </div>
    );
  }

import { Toaster } from 'sonner';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';

import Landing from './pages/Landing';

function App() {
  // Check if user has onboarded (simple check)
  const RequireAuth = ({ children }) => {
    const profile = localStorage.getItem('user_profile');
    if (!profile) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  if (!import.meta.env.VITE_CLIENT_ID) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 text-red-800 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
          <p>
            <code>VITE_CLIENT_ID</code> is missing from environment variables.
          </p>
          <p className="text-sm mt-2 text-red-600">
            Please check your <code>.env</code> file and ensure the variable is set and passed to Docker.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />

          <Route path="/dashboard" element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route path="home" element={<Dashboard />} />
            <Route path="editor" element={<Editor />} />
            <Route path="pdf-editor" element={<PDFEditor />} />
            <Route path="tools" element={<Tools />} />
            <Route path="drafts" element={<MyDrafts />} />
            <Route path="research" element={<ResearchChat />} />
            <Route path="settings" element={<Settings />} />
            <Route path="chat" element={<Placeholder title="AI Chat" />} />
            {/* Catch-all relative to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
          </Route>

          {/* Global catch-all redirect to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
