import React, { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import useAuth from "../../hooks/useAuth";
import authApi from "../../api/auth.api"; // We'll add methods here
import { APPLICATION } from "../../config/application";

const WorkspaceInvitationsPage = ({ onNavigate }) => {
  const { user, acceptInvitation, declineInvitation, checkPendingInvitations, logout } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const invs = await checkPendingInvitations();
        setInvitations(invs || []);
      } catch (err) {
        console.error("Failed to fetch invitations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, [checkPendingInvitations]);

  const handleAccept = async (token) => {
    setProcessingId(token);
    try {
      await acceptInvitation(token);
      // Navigation to dashboard is handled within acceptInvitation if successful
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to accept invitation");
      setProcessingId(null);
    }
  };

  const handleDecline = async (token) => {
    setProcessingId(token);
    try {
      await declineInvitation(token);
      setInvitations(prev => prev.filter(inv => inv.token !== token));
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  // If list becomes empty after declining
  useEffect(() => {
    if (!loading && invitations.length === 0) {
      onNavigate("no-workspace");
    }
  }, [invitations, loading, onNavigate]);

  return (
    <AuthCard maxWidth="520px" padding="40px 36px">
      <AuthHeader
        title="Workspace Invitations"
        subtitle="You have been invited to join the following workspaces."
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
          Checking for invitations...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px", width: "100%" }}>
          {invitations.map((inv) => (
            <div 
              key={inv.id}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                backgroundColor: "var(--bg-card)",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                gap: "16px"
              }}
            >
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "var(--text-title)" }}>
                  {inv.workspaceName || "Workspace Invitation"}
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>
                  Invited by {inv.invitedBy} &bull; Role: {inv.role}
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => handleAccept(inv.token)}
                  disabled={!!processingId}
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "8px" }}
                >
                  {processingId === inv.token ? "Accepting..." : <><CheckCircle size={16} /> Accept</>}
                </button>
                <button
                  onClick={() => handleDecline(inv.token)}
                  disabled={!!processingId}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "10px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", borderRadius: "8px" }}
                >
                  <XCircle size={16} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "16px", borderTop: "1px dashed var(--border)", paddingTop: "24px" }}>
        <button 
          onClick={logout}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign out instead
        </button>
      </div>
    </AuthCard>
  );
};

export default WorkspaceInvitationsPage;
