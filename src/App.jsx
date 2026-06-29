import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import PDFEditor from './pages/PDFEditor';
import MyDrafts from './pages/MyDrafts';
import OnlyOfficeWorkspace from './pages/OnlyOfficeWorkspace';

import ResearchChat from './pages/ResearchChat';
import Tools from './pages/Tools';
import ChatWithPDF from './pages/ChatWithPDF';
import CaseSearch from './pages/CaseSearch';
import LegalWorkflow from './pages/LegalWorkflow';

import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import PaymentStatus from './pages/PaymentStatus';

import AdvocateProfile from './pages/AdvocateProfile';
import AdvocateDiscovery from './pages/AdvocateDiscovery';
import AdvocateDashboard from './pages/AdvocateDashboard';
import AdvocateLogin from './pages/AdvocateLogin';
import AdvocateSignup from './pages/AdvocateSignup';
import AdvocateOnboarding from './pages/AdvocateOnboarding';
import AdminDashboard from './pages/AdminDashboard';
import TranslateDocumentPage from './pages/TranslateDocumentPage';
import TranslateComparePage from './pages/TranslateComparePage';


// Placeholder for other routes
const Placeholder = ({ title }) => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <h2>{title}</h2>
    <p>This feature is coming soon.</p>
  </div>
);



import { Toaster } from 'sonner';

import Login from './pages/Login';
import Signup from './pages/Signup';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import ScrollToTop from './components/ScrollToTop';

import About from './pages/About';
import Landing from './pages/Landing';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import FAQs from './pages/FAQs';
import Disclaimer from './pages/Disclaimer';
import PrivacyPolicy from './pages/Privacy';
import TermsOfUse from './pages/Terms';
import ComingSoon from './pages/ComingSoon';
import LjAcademy from './pages/LjAcademy';
import RefundPolicy from './pages/RefundPolicy';
import Notifications from './pages/Notifications';
import { NotificationProvider } from './context/NotificationContext';
import Pricing from './pages/Pricing';
import Billing from './pages/billing';

const RequireAuth = ({ children }) => {
  const profile = localStorage.getItem('user_profile');
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // Requires a general user session
  const RequireAuth = ({ children }) => {
    const profile = localStorage.getItem('user_profile');
    if (!profile) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Requires a valid advocate JWT specifically
  const RequireAdvocateAuth = ({ children }) => {
    const advocateToken = localStorage.getItem('advocate_token');
    if (!advocateToken) {
      return <Navigate to="/advocate/login?session_expired=1" replace />;
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
      <NotificationProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors />
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Public pages */}
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/blogs" element={<ComingSoon title="Blog" />} />
            <Route path="/advocates" element={<AdvocateDiscovery />} />
            <Route path="/advocate/login" element={<AdvocateLogin />} />
            <Route path="/advocate/signup" element={<AdvocateSignup />} />
            <Route path="/advocate/onboarding" element={
              <RequireAdvocateAuth><AdvocateOnboarding /></RequireAdvocateAuth>
            } />
            <Route path="/advocate/:slug" element={<AdvocateProfile />} />
            <Route path="/admin/verifications" element={<AdminDashboard />} />

            
            <Route path="/blogs" element={<ComingSoon title="Blog" />} />
            <Route path="/academy" element={<LjAcademy />} />
            <Route path="/dashboard" element={<Navigate to="/dashboard/home" replace />} />

            {/* Comparison view moved outside MainLayout for a full-screen experience */}
            <Route path="/dashboard/translate/compare/:jobId" element={<RequireAuth><TranslateComparePage /></RequireAuth>} />

            <Route path="/dashboard" element={<RequireAuth><MainLayout /></RequireAuth>}>
              <Route path="home" element={<Dashboard />} />
              <Route path="editor" element={<Editor />} />
              <Route path="workspace" element={<OnlyOfficeWorkspace />} />
              <Route path="translate" element={<TranslateDocumentPage />} />
              <Route path="pdf-editor" element={<PDFEditor />} />
              <Route path="tools" element={<Tools />} />
              <Route path="drafts" element={<MyDrafts />} />
              <Route path="research" element={<ResearchChat />} />
              <Route path="chat-pdf" element={<ChatWithPDF />} />
              <Route path="case-search" element={<CaseSearch />} />
              <Route path="legal-workflow" element={<LegalWorkflow />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<HelpCenter />} />
              <Route path="billing" element={<Billing/>}/>
              <Route path="notifications" element={<Notifications />} />
              <Route path="advocate-profile" element={
                <RequireAdvocateAuth><AdvocateDashboard /></RequireAdvocateAuth>
              } />
              <Route path="chat" element={<Placeholder title="AI Chat" />} />
              {/* Catch-all relative to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
            </Route>

            {/* Payment Verification Route */}
            <Route path="/payment-status" element={<PaymentStatus />} />

            {/* Global catch-all redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
