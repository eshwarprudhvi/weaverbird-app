import React from "react";
import { Building2, RefreshCw, LogOut } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import AuthActionCard from "../../components/auth/AuthActionCard";
import useAuth from "../../hooks/useAuth";

const YoureAlmostReadyPage = ({ onNavigate }) => {
  const { logout, checkPendingInvitations } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const invs = await checkPendingInvitations();
      if (invs && invs.length > 0) {
        onNavigate("pending-invitations");
      } else {
        alert("No pending invitations found yet. Please check back later.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AuthCard maxWidth="520px" padding="40px 36px">
      <AuthHeader
        title="You're Almost Ready"
        subtitle="You're signed in, but you're not yet connected to a workspace. Choose an option below."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", marginBottom: "28px" }}>
        {/* Create Workspace */}
        <AuthActionCard
          icon={Building2}
          title="Create a Workspace"
          description="Start a new company studio and become its Workspace Owner."
          onClick={() => onNavigate("create")}
          isPrimary={true}
        />

        {/* Refresh Invitations */}
        <AuthActionCard
          icon={RefreshCw}
          title={refreshing ? "Refreshing..." : "Check for Invitations"}
          description="Wait for an invitation from your Workspace Administrator."
          onClick={handleRefresh}
        />
      </div>

      <div style={{ textAlign: "center", borderTop: "1px dashed var(--border)", paddingTop: "24px" }}>
        <button 
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "14px",
            cursor: "pointer",
            width: "100%"
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </AuthCard>
  );
};

export default YoureAlmostReadyPage;
