import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import fullLogo from "../assets/FULL_LOGO.svg";
import "./Onboarding.css";

const UserDetails = () => {
  const navigate = useNavigate();
  const [useCase, setUseCase] = useState("");
  const [industry, setIndustry] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const useCases = [
    "Personal Legal Matters",
    "Business Contracts",
    "Property Documentation",
    "Family Disputes",
    "Consumer Complaints",
    "Employment Issues",
  ];

  const industries = ["Technology", "Healthcare", "Finance", "Real Estate", "Education", "E-commerce", "Manufacturing", "Other"];

  const handleSubmit = async () => {
    if (!useCase) return toast.error("Please select your use case");
    if (!industry) return toast.error("Please select your industry");

    setIsLoading(true);
    const userProfile = JSON.parse(localStorage.getItem("user_profile") || "{}");
    userProfile.use_case = useCase;
    userProfile.industry = industry;
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
          <h1 className="details-title">≡ƒæï Welcome aboard!</h1>
          <p className="details-subtitle">
            Tell us why you're here so we can give you the <strong>best experience</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">What brings you to DraftMate?</label>
            <div className="options-list">
              {useCases.map((u) => (
                <button
                  key={u}
                  className={`option-radio ${useCase === u ? "active" : ""}`}
                  onClick={() => setUseCase(u)}
                >
                  <span className="radio-circle">
                    {useCase === u && <span className="radio-dot" />}
                  </span>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Industry</label>
            <div className="options-grid">
              {industries.map((i) => (
                <button
                  key={i}
                  className={`option-pill ${industry === i ? "active" : ""}`}
                  onClick={() => setIndustry(i)}
                >
                  {i}
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

export default UserDetails;
