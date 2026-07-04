import React, { useState } from "react";
import { ArrowLeft, KeyRound, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const JoinWorkspaceForm = ({ onBack, onSuccess }) => {
  const { joinWorkspace, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    code: "",
    email: ""
  });
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.email.trim()) {
      setError("Please enter both the invitation code/link and your email address.");
      return;
    }

    try {
      await joinWorkspace({
        code: formData.code.trim(),
        email: formData.email.trim().toLowerCase()
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || "Invalid invitation code or link. Please check and try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
        <ArrowLeft size={16} /> Back to Welcome Hub
      </button>

      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-title)", margin: "0 0 6px 0" }}>
          Join a Workspace
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
          Accept an invitation from an existing team to collaborate on their studio projects.
        </p>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* Invitation Code or Link */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
          Invitation Code or Link *
        </label>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
          <input
            type="text"
            value={formData.code}
            onChange={(e) => handleChange("code", e.target.value)}
            placeholder="e.g., INV-849201 or paste link"
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

      {/* Your Email */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
          Your Email Address *
        </label>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="your.name@example.com"
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

      <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "rgba(212, 175, 55, 0.06)", border: "1px solid rgba(212, 175, 55, 0.2)", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
        💡 Joining an existing workspace grants you team membership without creating a duplicate workspace.
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
          marginTop: "6px",
          boxShadow: "0 4px 12px rgba(212, 175, 55, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? "Joining Workspace..." : "Join Workspace"} <ArrowRight size={18} />
      </button>
    </form>
  );
};

export default JoinWorkspaceForm;
