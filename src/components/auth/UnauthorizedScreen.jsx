import React from "react";
import { AlertTriangle } from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { APPLICATION } from "../../config/application";

const UnauthorizedScreen = ({
  userEmail,
  setCloudSyncEnabled,
  setIsAuthorized,
  setUserEmail
}) => {
  const { workspace } = useWorkspace();
  const companyName = workspace?.companyName || "My Workspace";
  const studioName = workspace?.studioName || "Interior Studio";

  return (
    <div className="screen-content fade-in" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "24px",
      textAlign: "center",
      backgroundColor: "var(--bg-body)",
      gap: "20px"
    }}>
      <div style={{
        width: "80px",
        height: "80px",
        borderRadius: "40px",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ef4444",
        marginBottom: "10px",
        marginTop: "40px"
      }}>
        <AlertTriangle size={40} />
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-title)", margin: 0 }}>Access Restricted</h2>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
        Your email <strong>{userEmail}</strong> is not authorized to access {companyName} {studioName}'s cloud database.
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
        Please ask your administrator to grant access to your email from their settings panel.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: "center", marginTop: "10px" }}>
        <button
          onClick={() => {
            setCloudSyncEnabled(false);
            localStorage.setItem(APPLICATION.storageKeys.cloudSync, "false");
            setIsAuthorized(true);
          }}
          style={{
            width: "100%",
            maxWidth: "240px",
            padding: "10px 20px",
            borderRadius: "8px",
            backgroundColor: "var(--accent-gold-dark)",
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Back to Local-Only Mode
        </button>
        <button
          onClick={() => {
            setUserEmail("");
            localStorage.removeItem(APPLICATION.storageKeys.userEmail);
            setIsAuthorized(true);
          }}
          style={{
            width: "100%",
            maxWidth: "240px",
            padding: "10px 20px",
            borderRadius: "8px",
            backgroundColor: "transparent",
            color: "var(--text-main)",
            border: "1px solid var(--border)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Try a Different Email
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedScreen;
