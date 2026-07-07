import React, { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, ArrowRight, Clock, MessageSquare, Shield, AlertCircle } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import useAuth from "../../hooks/useAuth";

const WorkspaceInvitationsPage = ({ onNavigate, onWorkspaceSelected }) => {
  const { user, acceptInvitation, declineInvitation, checkPendingInvitations, logout, switchWorkspace } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const handleAccept = async (inv) => {
    const idOrToken = inv.token || inv.id;
    setProcessingId(idOrToken);
    setErrorMsg(null);
    try {
      const result = await acceptInvitation(idOrToken);
      // Set the accepted workspace as the active workspace in Auth context
      // so WorkspaceBootstrapper can bootstrap it correctly.
      if (result?.workspaceId) {
        await switchWorkspace(result.workspaceId);
      }
      // Gate passed — surface the dashboard
      if (onWorkspaceSelected) onWorkspaceSelected();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to accept invitation");
      setProcessingId(null);
    }
  };

  const handleDecline = async (inv) => {
    const idOrToken = inv.token || inv.id;
    setProcessingId(idOrToken);
    setErrorMsg(null);
    try {
      await declineInvitation(idOrToken);
      setInvitations(prev => prev.filter(i => (i.token !== idOrToken && i.id !== idOrToken)));
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  // When no invitations remain, decide where to go next
  useEffect(() => {
    if (!loading && invitations.length === 0 && onNavigate) {
      // If there are accepted invitations / existing workspaces, go to switcher
      // otherwise go to no-workspace. Checking via checkPendingInvitations alone
      // is not enough here; we simply send them to 'switch' so WorkspaceSwitcherPage
      // can render their workspaces (it handles the empty case gracefully).
      onNavigate("switch");
    }
  }, [invitations, loading, onNavigate]);

  const getCountdownText = (expiresAt) => {
    if (!expiresAt) return "No expiration date";
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) {
      return `Expires in ${days} day${days === 1 ? "" : "s"} and ${hours} hr${hours === 1 ? "" : "s"}`;
    }
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Expires in ${hours} hr${hours === 1 ? "" : "s"} and ${mins} min${mins === 1 ? "" : "s"}`;
  };

  const formatRoleDisplay = (roleStr) => {
    if (!roleStr) return "Member";
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
  };

  return (
    <AuthCard maxWidth="560px" padding="40px 36px">
      <AuthHeader
        title="Workspace Invitations"
        subtitle="You have been invited to collaborate on the following team workspaces."
      />

      {errorMsg && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#f87171",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px"
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <Clock className="spin" size={24} color="#6366f1" />
          <span>Checking secure invitations...</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "28px", width: "100%" }}>
          {invitations.map((inv) => {
            const isProcessing = processingId === inv.token || processingId === inv.id;
            return (
              <div 
                key={inv.id || inv.token}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "24px",
                  background: "linear-gradient(145deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  gap: "16px",
                  transition: "transform 0.2s, border-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"}
              >
                {/* Header Info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "700", color: "#fff" }}>
                      {inv.workspaceName || "Studio Workspace"}
                    </h4>
                    <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                      Invited by <strong style={{ color: "#e2e8f0" }}>{inv.invitedBy || "Administrator"}</strong>
                    </span>
                  </div>

                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: '20px',
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    color: "#818cf8",
                    fontSize: "12px",
                    fontWeight: "600"
                  }}>
                    <Shield size={13} />
                    {formatRoleDisplay(inv.role)}
                  </span>
                </div>

                {/* Optional Message Box */}
                {inv.message && (
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(0, 0, 0, 0.25)",
                    borderLeft: "3px solid #6366f1",
                    color: "#cbd5e1",
                    fontSize: "13px",
                    fontStyle: "italic",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px"
                  }}>
                    <MessageSquare size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>"{inv.message}"</span>
                  </div>
                )}

                {/* Expiration Countdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#facc15" }}>
                  <Clock size={14} />
                  <span>{getCountdownText(inv.expiresAt)}</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <button
                    onClick={() => handleAccept(inv)}
                    disabled={!!processingId}
                    style={{
                      flex: 1,
                      padding: "12px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: processingId ? "not-allowed" : "pointer",
                      opacity: isProcessing ? 0.7 : 1,
                      boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                      transition: "all 0.2s"
                    }}
                  >
                    {isProcessing ? "Joining..." : <><CheckCircle size={16} /> Accept Invitation</>}
                  </button>

                  <button
                    onClick={() => handleDecline(inv)}
                    disabled={!!processingId}
                    style={{
                      flex: 1,
                      padding: "12px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px",
                      borderRadius: "10px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#e2e8f0",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: processingId ? "not-allowed" : "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { if (!processingId) e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)"; }}
                    onMouseOut={(e) => { if (!processingId) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"; }}
                  >
                    <XCircle size={16} /> Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "16px", borderTop: "1px dashed var(--border)", paddingTop: "24px" }}>
        <button 
          onClick={logout}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "14px", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign out of this account
        </button>
      </div>
    </AuthCard>
  );
};

export default WorkspaceInvitationsPage;
