import React, { useState } from "react";
import { ArrowLeft, Building2, User, Mail, Lock, Globe, Briefcase, Sparkles, CheckCircle2 } from "lucide-react";
import { APPLICATION } from "../../config/application";
import useAuth from "../../hooks/useAuth";

const WorkspaceCreationForm = ({ onBack, onSuccess }) => {
  const { registerWorkspace, isLoading, user } = useAuth();
  const [step, setStep] = useState(1);

  // Form State — email comes from the authenticated user session
  const [formData, setFormData] = useState({
    companyName: "",
    studioName: "",
    ownerName: "",
    email: user?.email || "",
    businessCategory: "Interior Design",
    country: "United States"
  });

  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!formData.studioName || !formData.ownerName) {
      setError("Please fill in all required fields.");
      return;
    }

    // Check selfRegistration feature flag
    if (!APPLICATION.features.selfRegistration) {
      setStep("coming_soon");
      return;
    }

    try {
      const res = await registerWorkspace(formData);
      if (res && res.status === "coming_soon") {
        setStep("coming_soon");
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || "Failed to register workspace. Please try again.");
    }
  };

  // STEP 1: Company Name
  if (step === 1) {
    return (
      <form onSubmit={handleStep1Submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
            width: "fit-content",
            marginBottom: "4px"
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-title)", margin: "0 0 6px 0" }}>
            Create Your Workspace
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            Step 1 of 2: What is the name of your company?
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
            Company Name *
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Building2 size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="e.g., Acme Architecture & Interiors"
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-app)",
                color: "var(--text-main)",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "var(--accent-gold-dark)",
            color: "white",
            border: "none",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "10px",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          Continue <Sparkles size={18} />
        </button>
      </form>
    );
  }

  // STEP 2: Details & Auth
  if (step === 2) {
    return (
      <form onSubmit={handleStep2Submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
            width: "fit-content"
          }}
        >
          <ArrowLeft size={16} /> Previous Step
        </button>

        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-title)", margin: "0 0 4px 0" }}>
            Workspace Details
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Step 2 of 2: Configure your studio details
          </p>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px" }}>
            {error}
          </div>
        )}

        {/* Studio Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-title)" }}>Studio Name *</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Building2 size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px" }} />
            <input
              type="text"
              value={formData.studioName}
              onChange={(e) => handleChange("studioName", e.target.value)}
              placeholder="e.g., Design Studio NYC"
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13px", outline: "none" }}
            />
          </div>
        </div>

        {/* Owner Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-title)" }}>Owner Name *</label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px" }} />
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
              placeholder="e.g., Jane Doe"
              style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13px", outline: "none" }}
            />
          </div>
        </div>

        {/* Email (read-only, from authenticated session) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-title)" }}>Signed in as</label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 12px 10px 36px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-app)",
            position: "relative",
            opacity: 0.8
          }}>
            <Mail size={16} color="var(--accent-gold)" style={{ position: "absolute", left: "12px" }} />
            <span style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: "500" }}>
              {user?.email || "Not signed in"}
            </span>
            <CheckCircle2 size={14} color="var(--accent-gold)" style={{ marginLeft: "auto" }} />
          </div>
        </div>

        {/* Category & Country Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-title)" }}>Category</label>
            <select
              value={formData.businessCategory}
              onChange={(e) => handleChange("businessCategory", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13px", outline: "none" }}
            >
              <option value="Interior Design">Interior Design</option>
              <option value="Architecture">Architecture</option>
              <option value="Construction">Construction</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-title)" }}>Country</label>
            <select
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13px", outline: "none" }}
            >
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="India">India</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "var(--accent-gold-dark)",
            color: "white",
            border: "none",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "10px",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)",
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? "Creating Workspace..." : "Create Workspace"}
        </button>
      </form>
    );
  }

  // STEP "coming_soon": Professional completion message
  if (step === "coming_soon") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "20px", padding: "16px 0" }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "36px",
          backgroundColor: "rgba(212, 175, 55, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-gold)",
          marginBottom: "4px"
        }}>
          <Sparkles size={36} />
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text-title)", margin: 0 }}>
          Workspace Creation Coming Soon
        </h3>

        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: "1.6" }}>
          Self-service workspace creation is currently being finalized. This feature will be available in an upcoming release.
        </p>

        <div style={{ padding: "14px 18px", borderRadius: "12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--text-main)", lineHeight: "1.5" }}>
          If you've been invited by an administrator, please use <strong>Join Workspace</strong> instead. Thank you for your interest!
        </div>

        <button
          type="button"
          onClick={onBack}
          style={{
            padding: "12px 28px",
            borderRadius: "10px",
            backgroundColor: "transparent",
            color: "var(--text-title)",
            border: "1px solid var(--border)",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "8px",
            transition: "all 0.2s"
          }}
        >
          Back to Welcome Hub
        </button>
      </div>
    );
  }

  return null;
};

export default WorkspaceCreationForm;
