import React from "react";
import { Building2, LogIn, Users, HardDrive } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthActionCard from "../../components/auth/AuthActionCard";
import useAuth from "../../hooks/useAuth";

const WelcomePage = ({ onNavigate }) => {
  const { continueOffline } = useAuth();

  return (
    <AuthCard maxWidth="520px" padding="40px 36px">
      <AuthHeader
        title="Welcome to your Studio Hub"
        subtitle="Collaborate with your team, sync projects in real-time, or manage local designs seamlessly."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", marginBottom: "28px" }}>
        {/* Create Workspace */}
        <AuthActionCard
          icon={Building2}
          title="Create Workspace"
          description="Start a new company studio and become its Workspace Owner."
          onClick={() => onNavigate("create")}
          isPrimary={true}
          badge="New"
        />

        {/* Sign In */}
        <AuthActionCard
          icon={LogIn}
          title="Sign In"
          description="Already have a workspace? Sign in to sync and collaborate."
          onClick={() => onNavigate("login")}
        />

        {/* Join Workspace */}
        <AuthActionCard
          icon={Users}
          title="Join Workspace"
          description="Accept an invitation code or link from an existing team."
          onClick={() => onNavigate("join")}
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
