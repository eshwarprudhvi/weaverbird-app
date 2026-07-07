import React, { useState } from "react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPasswordPage = ({ onNavigate }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSending, setIsSending] = useState(false);

  const isSuccess = message.type === "success";

  const handleSendReset = async () => {
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    
    setIsSending(true);
    setMessage({ type: "", text: "" });
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        type: "success", 
        text: "Success! A secure password reset link has been sent. Please check your inbox (and Spam/Junk folder) to set your new password." 
      });
      setEmail("");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setMessage({ type: "error", text: "No account found with this email." });
      } else {
        setMessage({ type: "error", text: err.message || "Failed to send reset email." });
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthCard maxWidth="440px" padding="36px 32px">
      <AuthHeader title="Recover Password" subtitle="Enter your registered email address and we'll send you a secure link to reset your password." />
      
      <div style={{ padding: "20px 0 0 0" }}>
        {message.text && (
          <div style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#ef4444' : '#10b981', lineHeight: '1.4' }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          {!isSuccess && (
            <>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-title)", marginBottom: "8px" }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-body)", color: "var(--text-title)", fontSize: "14px", boxSizing: "border-box" }}
              />
            </>
          )}
        </div>

        {!isSuccess && (
          <button
            onClick={handleSendReset}
            disabled={isSending}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "var(--accent-gold)", color: "white", border: "none", cursor: isSending ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", marginBottom: "16px", opacity: isSending ? 0.7 : 1 }}
          >
            {isSending ? "Sending..." : "Send Reset Link"}
          </button>
        )}

        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => onNavigate("login")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "13px", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </AuthCard>
  );
};

export default ForgotPasswordPage;
