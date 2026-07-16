import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import fullLogo from "../assets/FULL_LOGO.svg";
import "./Onboarding.css";

const FirmDetails = () => {
  const navigate = useNavigate();
  const [firmName, setFirmName] = useState("");
  const [position, setPosition] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const positions = ["Partner", "Senior Associate", "Associate", "Junior Associate", "Paralegal"];
  const teamSizes = ["1-10", "11-50", "51-200", "200+"];

  const handleSubmit = async () => {
    if (!firmName.trim()) return toast.error("Please enter your firm name");
    if (!position) return toast.error("Please select your position");
    if (!teamSize) return toast.error("Please select team size");

    setIsLoading(true);
    const userProfile = JSON.parse(localStorage.getItem("user_profile") || "{}");
    userProfile.firm_name = firmName;
    userProfile.position = position;
    userProfile.team_size = teamSize;
    localStorage.setItem("user_profile", JSON.stringify(userProfile));

    await new Promise((res) => setTimeout(res, 500));
    toast.success("Profile saved!");
    navigate("/dashboard/home");
  };

  return (
    <div className="onboarding-container">
      <header className="onboarding-header anim-fade-down">
        <a href="/" className="onboarding-logo">
          <img src={fullLogo} alt="DraftMate" className="logo-image" />
        </a>
      </header>

      <main className="onboarding-content">
        <div className="details-card anim-fade-up">
          <h1 className="details-title">≡ƒÅ¢∩╕Å Welcome, Firm Member!</h1>
          <p className="details-subtitle">
            Tell us about your <strong>firm</strong> and your <strong>role</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Firm Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., AZB & Partners"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Your Position</label>
            <div className="options-list">
              {positions.map((p) => (
                <button
                  key={p}
                  className={`option-radio ${position === p ? "active" : ""}`}
                  onClick={() => setPosition(p)}
                >
                  <span className="radio-circle">
                    {position === p && <span className="radio-dot" />}
                  </span>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Firm Size</label>
            <div className="options-grid">
              {teamSizes.map((size) => (
                <button
                  key={size}
                  className={`option-pill ${teamSize === size ? "active" : ""}`}
                  onClick={() => setTeamSize(size)}
                >
                  {size} People
                </button>
              ))}
            </div>
          </div>

          <button
            className="continue-btn full-width-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue to Dashboard ΓåÆ"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default FirmDetails;
