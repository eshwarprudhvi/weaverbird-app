import React from "react";
import { Folder, Users, HardDrive, Clock, Activity, RefreshCw } from "lucide-react";
import Card from "../common/Card/Card";
import { WORKSPACE_CONNECTION_STATES } from "../../contexts/AuthContext";

const WorkspaceOverviewCard = ({
  projectsCount = 0,
  membersCount = 1,
  storageUsed = "0 B",
  lastSyncText = "Just now",
  syncDetailText = null,
  connectionState = WORKSPACE_CONNECTION_STATES.OFFLINE,
  onRetry,
}) => {
  let statusBadgeText = "Offline";
  let statusBadgeColor = "var(--text-muted)";
  let isSpinning = false;

  switch (connectionState) {
    case WORKSPACE_CONNECTION_STATES.CONNECTED:
      statusBadgeText = "Connected";
      statusBadgeColor = "#10b981";
      break;
    case WORKSPACE_CONNECTION_STATES.CONNECTING:
      statusBadgeText = "Connecting...";
      statusBadgeColor = "#f59e0b";
      isSpinning = true;
      break;
    case WORKSPACE_CONNECTION_STATES.SYNCING:
      statusBadgeText = "Syncing...";
      statusBadgeColor = "#3b82f6";
      isSpinning = true;
      break;
    case WORKSPACE_CONNECTION_STATES.SYNC_ERROR:
      statusBadgeText = "Sync Failed";
      statusBadgeColor = "#ef4444";
      break;
    case WORKSPACE_CONNECTION_STATES.UNCONFIGURED:
      statusBadgeText = "Cloud Account";
      statusBadgeColor = "#3b82f6";
      break;
    case WORKSPACE_CONNECTION_STATES.OFFLINE:
    default:
      statusBadgeText = "Offline";
      statusBadgeColor = "var(--text-muted)";
      break;
  }

  return (
    <Card
      style={{
        padding: "20px",
        marginBottom: "16px",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Workspace Overview
        </span>
      </div>

      {/* Grouped Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
        <div style={{ padding: "10px 4px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Folder size={12} color="#3b82f6" style={{ flexShrink: 0 }} />
            <span>Projects</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-title)" }}>{projectsCount}</div>
        </div>

        <div style={{ padding: "10px 4px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Users size={12} color="#a855f7" style={{ flexShrink: 0 }} />
            <span>Members</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-title)" }}>{membersCount}</div>
        </div>

        <div style={{ padding: "10px 4px", backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <HardDrive size={12} color="#10b981" style={{ flexShrink: 0 }} />
            <span>Storage</span>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-title)", marginTop: "4px", wordBreak: "break-all" }}>{storageUsed}</div>
        </div>
      </div>

      {/* Status and Sync Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px 16px", backgroundColor: "rgba(255, 255, 255, 0.015)", borderRadius: "12px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={14} color="#f59e0b" />
            <span>{connectionState === WORKSPACE_CONNECTION_STATES.SYNCING ? "Syncing..." : "Last Sync"}</span>
          </span>
          <span style={{ fontWeight: 700, color: "var(--text-title)", display: "flex", alignItems: "center", gap: "6px" }}>
            {isSpinning && <RefreshCw size={12} className="spin-animation" color="#3b82f6" />}
            <span>{lastSyncText}</span>
            {connectionState === WORKSPACE_CONNECTION_STATES.SYNC_ERROR && onRetry && (
              <button
                onClick={onRetry}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "12px",
                  marginLeft: "4px",
                }}
              >
                Retry →
              </button>
            )}
          </span>
        </div>
        {syncDetailText && (
          <div style={{ fontSize: "11px", color: "#3b82f6", textAlign: "right", marginTop: "-4px" }}>
            {syncDetailText}
          </div>
        )}

        <div style={{ height: "1px", backgroundColor: "var(--border)", margin: "2px 0" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
          <span style={{ color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={14} color={statusBadgeColor} />
            <span>Status</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: statusBadgeColor, fontWeight: 700 }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: statusBadgeColor,
                display: "inline-block",
              }}
            />
            <span>{statusBadgeText}</span>
          </span>
        </div>
      </div>
    </Card>
  );
};

export default WorkspaceOverviewCard;
