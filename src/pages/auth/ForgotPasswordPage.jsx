import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";

const ForgotPasswordPage = ({ onNavigate }) => {
  return (
    <AuthCard maxWidth="440px" padding="36px 32px">
      <AuthHeader title="Recover Password" subtitle="We will send password reset instructions to your registered email address." />
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
          Password recovery is scaffolded for future email verification integration.
        </p>
        <button
          onClick={() => onNavigate("login")}
          style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: "var(--accent-gold-dark)", color: "white", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
        >
          Back to Sign In
        </button>
      </div>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
