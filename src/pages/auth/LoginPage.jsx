import React, { useState } from "react";
import { ArrowLeft, Mail, LogIn, Lock, UserPlus } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import useAuth from "../../hooks/useAuth";

const LoginPage = ({ onNavigate }) => {
  const { login, register, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      if (isRegistering) {
        await register({ email: cleanEmail, password });
      } else {
        await login({ email: cleanEmail, password });
      }
    } catch (err) {
      setError(err.message || (isRegistering ? "Registration failed." : "Failed to sign in. Please check your credentials."));
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
        <ArrowLeft size={16} /> Back
      </button>

      <AuthHeader
        title={isRegistering ? "Create Account" : "Sign In"}
        subtitle={isRegistering ? "Register your email to get started." : "Enter your credentials to access your account."}
      />

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Email Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
            Email
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

        {/* Password Field */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-title)" }}>
            Password
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="••••••••"
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
          
          {!isRegistering && (
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => onNavigate("forgot-password")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-gold)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}
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
          {isLoading ? (isRegistering ? "Creating..." : "Signing In...") : (isRegistering ? "Create Account" : "Continue")} 
          {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0", color: "var(--text-muted)", fontSize: "12px" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
        <span>OR</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
      </div>

      <div style={{ textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
        {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-gold)",
            fontWeight: "600",
            cursor: "pointer",
            padding: 0
          }}
        >
          {isRegistering ? "Sign In" : "Create Account"}
        </button>
      </div>
    </AuthCard>
  );
};

export default LoginPage;
