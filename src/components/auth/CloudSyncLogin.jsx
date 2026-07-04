import React from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";

const CloudSyncLogin = ({
  setUserEmail,
  isConnectingCloud,
  setIsConnectingCloud,
  setCloudSyncEnabled,
  setIsAuthorized
}) => {
  const { workspace } = useWorkspace();
  const companyName = workspace?.companyName || "My Workspace";

  return (
    <div className="screen-content fade-in" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "30px 24px",
      textAlign: "center",
      backgroundColor: "var(--bg-body)",
      gap: "24px"
    }}>
      <div style={{
        width: "90px",
        height: "90px",
        borderRadius: "45px",
        backgroundColor: "rgba(212, 175, 55, 0.04)",
        border: "2px solid rgba(212, 175, 55, 0.7)",
        boxShadow: "0 4px 15px rgba(212, 175, 55, 0.15), inset 0 2px 10px rgba(212, 175, 55, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "36px",
        fontWeight: "700",
        fontFamily: "'Playfair Display', 'Cinzel', 'Times New Roman', serif",
        fontStyle: "italic",
        background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        {companyName.trim().split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase()}
      </div>

      <div>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-gold)", letterSpacing: "2px", textTransform: "uppercase" }}>
          {companyName}
        </span>
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-title)", margin: "4px 0 0 0" }}>
          Cloud Sync Portal
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
          Enter your email address to sync projects and milestones with your team.
        </p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          id="login-email-input"
          type="email"
          placeholder="your.name@example.com"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-main)",
            fontSize: "14px",
            outline: "none",
            textAlign: "center"
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              document.getElementById("login-connect-btn")?.click();
            }
          }}
        />

        <button
          id="login-connect-btn"
          onClick={async () => {
            const emailVal = document.getElementById("login-email-input")?.value?.toLowerCase()?.trim();
            if (!emailVal || !emailVal.includes("@")) {
              alert("Please enter a valid email address!");
              return;
            }
            setIsConnectingCloud(true);
            try {
              setUserEmail(emailVal);
              localStorage.setItem("weaverbird_user_email", emailVal);
            } catch (err) {
              alert(`Connection failed: ${err.message}`);
            } finally {
              setIsConnectingCloud(false);
            }
          }}
          disabled={isConnectingCloud}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "10px",
            backgroundColor: "var(--accent-gold-dark)",
            color: "white",
            border: "none",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.15)",
            transition: "all 0.2s"
          }}
        >
          {isConnectingCloud ? "Connecting..." : "Connect & Sync"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "10px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          First time? Connecting registers you as the Admin.
        </span>
        <button
          onClick={() => {
            setCloudSyncEnabled(false);
            localStorage.setItem("weaverbird_cloud_sync", "false");
            setIsAuthorized(true);
          }}
          style={{
            backgroundColor: "transparent",
            color: "var(--text-muted)",
            border: "none",
            fontSize: "12px",
            textDecoration: "underline",
            cursor: "pointer",
            padding: "8px"
          }}
        >
          Use Local-Only Mode
        </button>
      </div>
    </div>
  );
};

export default CloudSyncLogin;
