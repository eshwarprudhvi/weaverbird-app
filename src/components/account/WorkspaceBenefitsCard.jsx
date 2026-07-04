import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Card from "../common/Card/Card";
import { WORKSPACE_CONNECTION_STATES } from "../../contexts/AuthContext";

const WorkspaceBenefitsCard = ({
  connectionState = WORKSPACE_CONNECTION_STATES.OFFLINE,
  onConnect,
}) => {
  const isConnected = connectionState === WORKSPACE_CONNECTION_STATES.CONNECTED || connectionState === WORKSPACE_CONNECTION_STATES.SYNCING;
  if (isConnected) {
    return null;
  }

  const features = [
    "Team Collaboration",
    "Automatic Backups",
    "Email Reports",
    "AI Features",
    "Cross-device Sync",
  ];

  return (
    <Card
      style={{
        padding: "20px",
        marginBottom: "16px",
        border: isConnected ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid var(--border)",
        background: isConnected 
          ? "rgba(16, 185, 129, 0.02)" 
          : "var(--bg-card)",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Workspace Features
          </h4>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Unlock Enterprise Cloud Features
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 24px",
          marginBottom: !isConnected ? "16px" : "4px",
        }}
      >
        {features.map((feature, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-main)",
            }}
          >
            <CheckCircle2 size={16} color={isConnected ? "#10b981" : "var(--accent-gold, #f59e0b)"} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {!isConnected && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={onConnect}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "var(--accent-gold)",
              color: "white",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
          >
            Connect Workspace <ArrowRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
};

export default WorkspaceBenefitsCard;
