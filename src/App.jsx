import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import MyDrafts from './pages/MyDrafts';

import ResearchChat from './pages/ResearchChat';

// Placeholder for other routes
const Placeholder = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <h2>{title}</h2>
    <p>This feature is coming soon.</p>
  </div>
);

import { Toaster } from 'sonner';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="editor" element={<Editor />} />
          <Route path="drafts" element={<MyDrafts />} />
          <Route path="research" element={<ResearchChat />} />
          <Route path="chat" element={<Placeholder title="AI Chat" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
