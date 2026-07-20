import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import PDFEditor from './pages/PDFEditor';
import MyDrafts from './pages/MyDrafts';
import OnlyOfficeWorkspace from './pages/OnlyOfficeWorkspace';
import DraftingLanding from './pages/DraftingLanding';
import ResearchChat from './pages/ResearchChat';
import Tools from './pages/Tools';
import ChatWithPDF from './pages/ChatWithPDF';
import CaseSearch from './pages/CaseSearch';
import LegalWorkflow from './pages/LegalWorkflow';
import JudgmentsSaved from './pages/JudgmentsSaved';

import LibraryDashboard from './pages/library/LibraryDashboard';
import BareActs from './pages/library/BareActs';
import ActDetails from './pages/library/ActDetails';
import Judgments from './pages/library/Judgments';
import JudgmentDetails from './pages/library/JudgmentDetails';
import Bookmarks from './pages/library/Bookmarks';
import Notes from './pages/library/Notes';
import Forms from './pages/library/Forms';
import FormDetails from './pages/library/FormDetails';
import Dictionary from './pages/library/Dictionary';
import TermDetails from './pages/library/TermDetails';
import Diary from './pages/library/Diary';
import DiaryEntry from './pages/library/DiaryEntry';
import Calendar from './pages/library/Calendar';
import EventDetails from './pages/library/EventDetails';
import Hearings from './pages/library/Hearings';
import HearingDetails from './pages/library/HearingDetails';
import VideoLinks from './pages/library/VideoLinks';
import Clients from './pages/library/Clients';
import ClientDetails from './pages/library/ClientDetails';
import Cases from './pages/library/Cases';
import CaseDetails from './pages/library/CaseDetails';
import DocumentManagement from './pages/DocumentManagement';
import CaseTracking from './pages/library/CaseTracking';
import CaseTrackingDetails from './pages/library/CaseTrackingDetails';
import IntegrationSettings from './pages/library/IntegrationSettings';

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

// Onboarding Detail Pages (imported from feature/UI_changes)
import StudentDetails from './pages/StudentDetails';
import AdvocateDetails from './pages/AdvocateDetails';
import FirmDetails from './pages/FirmDetails';
import CADetails from './pages/CADetails';
import UserDetails from './pages/UserDetails';

import SitePolicy from './components/landing/sections/SitePolicy';


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
import Blogs from './pages/Blogs';
import BlogPost from './pages/BlogPost';
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
import ErrorBoundary from './components/ErrorBoundary';

const RequireAuth = ({ children }) => {
  const profile = localStorage.getItem('user_profile');
  if (!profile) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function LibraryRedirect() {
  const location = useLocation();
  return <Navigate to={`/dashboard${location.pathname}${location.search}`} replace />;
}

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
    const sessionId = localStorage.getItem('session_id');
    if (!advocateToken && !sessionId) {
      return <Navigate to="/advocate/login" replace />;
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
        <ErrorBoundary>
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
              <Route path="/onboarding/student-details" element={<StudentDetails />} />
              <Route path="/onboarding/advocate-details" element={<AdvocateDetails />} />
              <Route path="/onboarding/firm-details" element={<FirmDetails />} />
              <Route path="/onboarding/ca-details" element={<CADetails />} />
              <Route path="/onboarding/user-details" element={<UserDetails />} />

              <Route path="/cookie-policy" element={<SitePolicy />} />
              {/* Public pages */}
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

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
                <Route path="drafting" element={<DraftingLanding />} />
                <Route path="drafts" element={<MyDrafts />} />
                <Route path="research" element={<ResearchChat />} />
                <Route path="chat-pdf" element={<ChatWithPDF />} />
                <Route path="case-search" element={<CaseSearch />} />
                <Route path="legal-workflow" element={<LegalWorkflow />} />

                {/* New Judgment Routes */}
                <Route path="judgments" element={<Judgments />} />
                <Route path="judgments/:judgmentId" element={<JudgmentDetails />} />
                <Route path="judgments-saved" element={<Navigate to="/dashboard/library/judgments-saved" replace />} />

                {/* Library Routes */}
                <Route path="library" element={<LibraryDashboard />} />
                <Route path="library/bare-acts" element={<BareActs />} />
                <Route path="library/acts/:actId" element={<ActDetails />} />
                <Route path="library/judgments" element={<Navigate to="/dashboard/judgments" replace />} />
                <Route path="library/judgments/:judgmentId" element={<Navigate to="/dashboard/judgments/:judgmentId" replace />} />
                <Route path="library/judgments-saved" element={<JudgmentsSaved />} />
                <Route path="library/bookmarks" element={<Bookmarks />} />
                <Route path="library/notes" element={<Notes />} />
                <Route path="library/forms" element={<Forms />} />
                <Route path="library/forms/:formId" element={<FormDetails />} />
                <Route path="library/dictionary" element={<Dictionary />} />
                <Route path="library/dictionary/:termId" element={<TermDetails />} />
                <Route path="library/diary" element={<Diary />} />
                <Route path="library/diary/:entryId" element={<DiaryEntry />} />
                <Route path="library/calendar" element={<Calendar />} />
                <Route path="library/calendar/:eventId" element={<EventDetails />} />
                <Route path="library/hearings" element={<Hearings />} />
                <Route path="library/hearings/:hearingId" element={<HearingDetails />} />
                <Route path="library/video-links" element={<VideoLinks />} />
                <Route path="library/clients" element={<Clients />} />
                <Route path="library/clients/:clientId" element={<ClientDetails />} />
                <Route path="library/cases" element={<Cases />} />
                <Route path="library/cases/:caseId" element={<CaseDetails />} />
                <Route path="library/case-tracking" element={<CaseTracking />} />
                <Route path="library/case-tracking/:trackingId" element={<CaseTrackingDetails />} />
                <Route path="library/integrations/ecourts" element={<IntegrationSettings />} />

                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<HelpCenter />} />
                <Route path="billing" element={<Billing />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="advocate-profile" element={
                  <RequireAdvocateAuth><AdvocateDashboard /></RequireAdvocateAuth>
                } />
                <Route path="chat" element={<Placeholder title="AI Chat" />} />

                {/* Sidebar items — real pages */}
                <Route path="academy" element={<LjAcademy />} />

                <Route path="cases" element={<Navigate to="/dashboard/documents" replace />} />
                <Route path="documents" element={<DocumentManagement />} />
                {/* Visibility & Reach -> existing advocate dashboard (profile + analytics/reach) */}
                <Route path="profile" element={
                  <RequireAdvocateAuth><AdvocateDashboard /></RequireAdvocateAuth>
                } />
                <Route path="ecourt" element={<CaseTracking />} />

                {/* Catch-all relative to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
              </Route>

              {/* Payment Verification Route */}
              <Route path="/payment-status" element={<PaymentStatus />} />

              {/* Redirect /library paths to /dashboard/library paths so direct links work */}
              <Route path="/library/*" element={<LibraryRedirect />} />

              {/* Global catch-all redirect to Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
