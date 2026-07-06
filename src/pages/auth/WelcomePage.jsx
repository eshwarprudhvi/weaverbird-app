import React, { useState } from "react";
import { Building2, LogIn, HardDrive } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthActionCard from "../../components/auth/AuthActionCard";
import useAuth from "../../hooks/useAuth";

const WelcomePage = ({ onNavigate }) => {
  const { continueOffline, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");

  return (
    <AuthCard maxWidth="520px" padding="40px 36px">
      <AuthHeader
        title="Welcome to your Studio Hub"
        subtitle="Collaborate with your team, sync projects in real-time, or manage local designs seamlessly."
      />

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", marginBottom: "28px" }}>
        {/* Continue with Google */}
        <AuthActionCard
          icon={LogIn}
          title="Continue with Google"
          description="Sign in securely using your Google account."
          onClick={async () => {
             setError("");
             try {
                await loginWithGoogle();
             } catch (err) {
                setError(err.message || "Failed to sign in with Google.");
             }
          }}
          isPrimary={true}
        />

        {/* Continue with Email */}
        <AuthActionCard
          icon={Building2}
          title="Continue with Email"
          description="Sign in or create an account using your business email."
          onClick={() => onNavigate("login")}
        />
      </div>

      {/* Continue Offline Divider & Button */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        borderTop: "1px dashed var(--border)",
        paddingTop: "24px"
      }}>
        <button
          onClick={() => continueOffline()}
          className="offline-continue-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "transparent",
            border: "1px solid var(--border)",
            padding: "10px 20px",
            borderRadius: "100px",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-title)";
            e.currentTarget.style.borderColor = "var(--accent-gold)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <HardDrive size={16} /> Continue Offline <span style={{ opacity: 0.7, fontSize: "11px" }}>(Local Projects Only)</span>
        </button>
      </div>
    </AuthCard>
  );
};

export default WelcomePage;
