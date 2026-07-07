import React from "react";
import { RefreshCw } from "lucide-react";
import Card from "../common/Card/Card";
import { WORKSPACE_CONNECTION_STATES } from "../../contexts/AuthContext";

const WorkspaceStatusCard = ({
  connectionState = WORKSPACE_CONNECTION_STATES.OFFLINE,
  companyName = "",
  onConnect,
  onManage,
  onViewDetails,
  onRetry,
}) => {
  let statusText = "● Offline";
  let statusColor = "var(--text-muted)";
  let actionText = "Connect Workspace →";
  let onAction = onConnect;
  let isSpinning = false;
  let displayCompany = "";

  switch (connectionState) {
    case WORKSPACE_CONNECTION_STATES.CONNECTED:
      statusText = "● Connected";
      statusColor = "#10b981"; // Green
      actionText = "Manage Workspace →";
      onAction = onManage;
      displayCompany = companyName || "My Workspace";
      break;

    case WORKSPACE_CONNECTION_STATES.CONNECTING:
      statusText = "● Connecting";
      statusColor = "#f59e0b"; // Gold
      actionText = "Connecting...";
      onAction = null;
      isSpinning = true;
      displayCompany = companyName || "Workspace";
      break;

    case WORKSPACE_CONNECTION_STATES.SYNCING:
      statusText = "● Syncing";
      statusColor = "#3b82f6"; // Blue
      actionText = "Manage Workspace →";
      onAction = onViewDetails || onManage;
      isSpinning = true;
      displayCompany = companyName || "My Workspace";
      break;

    case WORKSPACE_CONNECTION_STATES.SYNC_ERROR:
      statusText = "● Sync Failed";
      statusColor = "#ef4444"; // Red
      actionText = "Retry →";
      onAction = onRetry || onConnect;
      displayCompany = companyName || "Workspace";
      break;

    case WORKSPACE_CONNECTION_STATES.UNCONFIGURED:
      statusText = "● Cloud Signed In";
      statusColor = "#3b82f6";
      actionText = "Select / Create Workspace →";
      onAction = onConnect;
      displayCompany = "No Workspace Selected";
      break;

    case WORKSPACE_CONNECTION_STATES.OFFLINE:
    default:
      statusText = "● Offline";
      statusColor = "var(--text-muted)";
      actionText = "Connect Workspace →";
      onAction = onConnect;
      displayCompany = "";
      break;
  }

  const isOnline =
    connectionState === WORKSPACE_CONNECTION_STATES.CONNECTED ||
    connectionState === WORKSPACE_CONNECTION_STATES.SYNCING;

  return (
    <Card
      style={{
        padding: "20px 24px",
        marginBottom: "24px",
        border: isOnline
          ? "1px solid rgba(16, 185, 129, 0.3)"
          : "1px solid var(--border)",
        background: isOnline
          ? "linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.04) 100%)"
          : "var(--bg-card)",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Row 1: Workspace title and Status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: displayCompany ? "12px" : "8px",
        }}
      >
        <span
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-title)",
            letterSpacing: "0.3px",
          }}
        >
          Workspace
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: statusColor,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {isSpinning && (
            <RefreshCw size={12} className="spin-animation" color={statusColor} />
          )}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Row 2: Company Name (or empty) and Action CTA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-muted)",
          }}
        >
          {displayCompany}
        </span>
        <button
          onClick={onAction}
          disabled={!onAction}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-gold, #f59e0b)",
            padding: 0,
            fontSize: "14px",
            fontWeight: 700,
            cursor: onAction ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
            transition: "opacity 0.2s ease",
            opacity: onAction ? 1 : 0.6,
          }}
        >
          <span>{actionText}</span>
        </button>
      </div>
    </Card>
  );
};

export default WorkspaceStatusCard;
