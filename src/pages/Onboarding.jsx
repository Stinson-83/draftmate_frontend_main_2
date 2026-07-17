// src/pages/Onboarding.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import fullLogo from "../assets/FULL_LOGO.svg"; // Γ£à Added import
import "./Onboarding.css";

const roles = [
  {
    id: "law_student",
    title: "Law Student",
    watermark: "JURIS",
    accent: "#3b82f6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.25 18L5 11l5-2.5L16.5 4l5.25 3.5v7.5L16.5 20l-8-2.5-3.25-.5Z" />
        <path d="m5 11 10 5.5" />
        <path d="M2.25 18v-5.5" />
        <path d="M21.75 12v5.5" />
        <path d="M11.5 8.5 16.5 4" />
        <path d="M12.5 21.5 16.5 20" />
      </svg>
    ),
  },
  {
    id: "advocate",
    title: "Advocate / Legal Pro",
    watermark: "LEX",
    accent: "#2563eb",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8" />
        <path d="M5 22V16" />
        <path d="M19 22V12" />
        <path d="M2 16h20" />
        <path d="M18.5 7.5a4.5 4.5 0 0 0-7.79-2.5" />
        <path d="M13.26 10.33a4.5 4.5 0 0 0 7.42-2.38" />
      </svg>
    ),
  },
  {
    id: "law_firm",
    title: "Law Firm Member",
    watermark: "FIRM",
    accent: "#1d4ed8",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-8" />
        <path d="M8.5 10.5 4 8" />
        <path d="M15.5 10.5 20 8" />
        <path d="M12 2v4" />
        <path d="m2 14 10 8 10-8" />
        <path d="m2 10 10 4 10-4" />
      </svg>
    ),
  },
  {
    id: "ca_cs",
    title: "CA / CS / Compliance",
    watermark: "AUDIT",
    accent: "#1e40af",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "non_legal",
    title: "Non-Legal User",
    watermark: "USER",
    accent: "#3b82f6",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
];

// Γ£à Role to Route Mapping
const ROLE_ROUTES = {
  law_student: "/onboarding/student-details",
  advocate: "/onboarding/advocate-details",
  law_firm: "/onboarding/firm-details",
  ca_cs: "/onboarding/ca-details",
  non_legal: "/onboarding/user-details",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
  };

  const triggerExitAndNavigate = (path) => {
    setIsExiting(true);
    setTimeout(() => navigate(path), 800);
  };

  // Γ£à UPDATED handleContinue - routes to specific details page based on role
  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue.");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Personalizing your experience...");

    try {
      // Save selected role to localStorage
      const userProfile = JSON.parse(
        localStorage.getItem("user_profile") || "{}"
      );
      userProfile.professional_background = selectedRole;
      localStorage.setItem("user_profile", JSON.stringify(userProfile));

      await new Promise((resolve) => setTimeout(resolve, 600));

      toast.dismiss(loadingToast);
      toast.success("Profile updated!");

      // Γ£à Route to the corresponding details page based on selected role
      const nextRoute = ROLE_ROUTES[selectedRole] || "/dashboard/home";
      triggerExitAndNavigate(nextRoute);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    triggerExitAndNavigate("/dashboard/home");
  };

  return (
    <div className={`onboarding-container ${isExiting ? "exiting" : ""}`}>
      <div className="law-bg-decor" aria-hidden="true">
        <svg
          className="bg-decor bg-decor-scales"
          viewBox="0 0 200 200"
          style={{
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="100" y1="30" x2="100" y2="170" />
            <line x1="70" y1="170" x2="130" y2="170" />
            <line x1="40" y1="60" x2="160" y2="60" />
            <line x1="100" y1="30" x2="40" y2="60" strokeDasharray="2,3" />
            <line x1="100" y1="30" x2="160" y2="60" strokeDasharray="2,3" />
            <path d="M 20 60 Q 40 110 60 60 Z" />
            <path d="M 140 60 Q 160 110 180 60 Z" />
            <circle cx="100" cy="30" r="5" fill="currentColor" />
          </g>
        </svg>

        <svg
          className="bg-decor bg-decor-gavel"
          viewBox="0 0 200 200"
          style={{
            transform: `translate(${mousePos.x * -0.7}px, ${mousePos.y * -0.7}px) rotate(-20deg)`,
          }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="50" y="70" width="80" height="40" rx="6" />
            <line x1="90" y1="110" x2="140" y2="160" />
            <rect x="30" y="155" width="100" height="12" rx="2" />
          </g>
        </svg>

        <svg
          className="bg-decor bg-decor-columns"
          viewBox="0 0 300 200"
          style={{
            transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.4}px)`,
          }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="20" y="20" width="260" height="12" />
            <rect x="10" y="32" width="280" height="8" />
            {[50, 110, 170, 230].map((x) => (
              <g key={x}>
                <rect x={x} y="40" width="30" height="10" />
                <line x1={x + 6} y1="50" x2={x + 6} y2="180" />
                <line x1={x + 15} y1="50" x2={x + 15} y2="180" />
                <line x1={x + 24} y1="50" x2={x + 24} y2="180" />
                <rect x={x - 4} y="180" width="38" height="10" />
              </g>
            ))}
          </g>
        </svg>

        <svg
          className="bg-decor bg-decor-doc"
          viewBox="0 0 200 240"
          style={{
            transform: `translate(${mousePos.x * -0.5}px, ${mousePos.y * -0.5}px)`,
          }}
        >
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M30 20 L130 20 L170 60 L170 220 L30 220 Z" />
            <path d="M130 20 L130 60 L170 60" />
            <line x1="50" y1="90" x2="150" y2="90" />
            <line x1="50" y1="110" x2="150" y2="110" />
            <line x1="50" y1="130" x2="130" y2="130" />
            <line x1="50" y1="160" x2="150" y2="160" />
            <line x1="50" y1="180" x2="120" y2="180" />
            <circle cx="130" cy="200" r="14" />
          </g>
        </svg>

        <div className="particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="particle"
              style={{
                left: `${(i * 53) % 100}%`,
                animationDelay: `${(i * 0.7) % 8}s`,
                animationDuration: `${10 + (i % 6)}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Γ£à UPDATED HEADER with fullLogo */}
      <header className="onboarding-header anim-fade-down">
        <a href="/" className="onboarding-logo">
          <img src={fullLogo} alt="DraftMate" className="logo-image" />
        </a>
        <div className="onboarding-header-actions">
          <button onClick={handleSkip} className="skip-btn" disabled={isLoading}>
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="continue-btn"
          >
            {isLoading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Continue
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="onboarding-content">
        <div className="hand-icon anim-wave">👋</div>
        <h1 className="onboarding-title anim-fade-up" style={{ animationDelay: "0.2s" }}>
          Welcome to <span className="title-gradient">DraftMate!</span>
        </h1>
        <p className="onboarding-subtitle anim-fade-up" style={{ animationDelay: "0.3s" }}>
          Let's personalize your experience. Choose the option that best describes you.
        </p>

        <div className="roles-grid">
          {roles.map((role, index) => (
            <div
              key={role.id}
              className={`role-card anim-scale-in ${selectedRole === role.id ? "selected" : ""}`}
              style={{
                animationDelay: `${0.4 + index * 0.08}s`,
                "--accent": role.accent,
              }}
              onClick={() => handleSelectRole(role.id)}
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && handleSelectRole(role.id)}
            >
              <span className="card-watermark">{role.watermark}</span>
              <span className="card-shimmer" />
              <span className="card-glow" />
              <div className="role-card-icon">{role.icon}</div>
              <h3 className="role-card-title">{role.title}</h3>
              <div className="checkmark-container">
                <svg className="checkmark-icon" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
              </div>
              <span className="card-ripple" />
            </div>
          ))}
        </div>

        <p className="onboarding-hint anim-fade-up" style={{ animationDelay: "1s" }}>
          {selectedRole
            ? "Great choice! Click Continue to proceed →"
            : "You can always change this later in your settings."}
        </p>
      </main>

      <div className="exit-overlay">
        <div className="exit-burst" />
      </div>
    </div>
  );
};

export default Onboarding;
