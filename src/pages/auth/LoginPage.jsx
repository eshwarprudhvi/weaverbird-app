import React, { useState } from "react";
import { ArrowLeft, Mail, LogIn, Sparkles } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import useAuth from "../../hooks/useAuth";
import { APPLICATION } from "../../config/application";

const LoginPage = ({ onNavigate }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await login({ email: cleanEmail });
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your email.");
    }
  };

  const handleGoogleAuth = async () => {
    // Simulated Google Auth integration
    const simulatedGoogleEmail = `user.${Date.now().toString().slice(-4)}@gmail.com`;
    try {
      await login({ email: simulatedGoogleEmail, provider: "google" });
    } catch (err) {
      setError("Google Sign-In failed.");
    }
  };

  return (
    <AuthCard maxWidth="460px" padding="36px 32px">
      <button
        type="button"
        onClick={() => onNavigate("welcome")}
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
          marginBottom: "12px"
        }}
      >
        <ArrowLeft size={16} /> Back to Welcome Hub
      </button>

      <AuthHeader
        title="Sign In"
        subtitle="Enter your authorized business email to access your workspace."
      />

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
            Business Email
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Mail size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="your.name@example.com"
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
          {isLoading ? "Signing In..." : "Sign In"} <LogIn size={18} />
        </button>
      </form>

      {APPLICATION.features.googleAuth && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", color: "var(--text-muted)", fontSize: "12px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            <span>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "var(--bg-app)",
              color: "var(--text-main)",
              border: "1px solid var(--border)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s"
            }}
          >
            <Sparkles size={16} color="var(--accent-gold)" /> Google Workspace
          </button>
        </>
      )}
    </AuthCard>
  );
};

export default LoginPage;
