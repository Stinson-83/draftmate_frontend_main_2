import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import fullLogo from "../assets/FULL_LOGO.svg";
import "./Onboarding.css";

const AdvocateDetails = () => {
  const navigate = useNavigate();
  const [barCouncil, setBarCouncil] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [experience, setExperience] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const practiceAreas = [
    "Criminal Law", "Civil Law", "Corporate Law", "Family Law",
    "Property Law", "Tax Law", "Intellectual Property", "Constitutional Law",
  ];

  const experienceLevels = ["0-2 Years", "3-5 Years", "6-10 Years", "10+ Years"];

  const handleSubmit = async () => {
    if (!barCouncil.trim()) return toast.error("Please enter your Bar Council ID");
    if (!practiceArea) return toast.error("Please select your practice area");
    if (!experience) return toast.error("Please select your experience");

    setIsLoading(true);
    const userProfile = JSON.parse(localStorage.getItem("user_profile") || "{}");
    userProfile.bar_council = barCouncil;
    userProfile.practice_area = practiceArea;
    userProfile.experience = experience;
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
          <h1 className="details-title">⚖️ Hello, Advocate!</h1>
          <p className="details-subtitle">
            Tell us about your <strong>practice</strong> so we can personalize your experience.
          </p>

          <div className="form-group">
            <label className="form-label">Bar Council ID / Enrollment Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., MH/12345/2020"
              value={barCouncil}
              onChange={(e) => setBarCouncil(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Practice Area</label>
            <div className="options-grid">
              {practiceAreas.map((area) => (
                <button
                  key={area}
                  className={`option-pill ${practiceArea === area ? "active" : ""}`}
                  onClick={() => setPracticeArea(area)}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <div className="options-list">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  className={`option-radio ${experience === level ? "active" : ""}`}
                  onClick={() => setExperience(level)}
                >
                  <span className="radio-circle">
                    {experience === level && <span className="radio-dot" />}
                  </span>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            className="continue-btn full-width-btn"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue to Dashboard →"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdvocateDetails;
