import React from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

/**
 * Reserved/Scaffolded Component for Future Multi-Workspace Switching
 * When a user belongs to multiple workspaces (Workspace A, Workspace B, Workspace C),
 * this component displays their available workspaces and allows switching.
 */
const WorkspaceSelector = ({ onSelectWorkspace, onAddNewWorkspace }) => {
  const { activeWorkspaceId } = useAuth();

  // Simulated future workspace list (Version 1 currently supports 1 active workspace)
  const workspaces = [
    { id: "default-workspace", name: "Primary Studio Workspace", role: "owner" }
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: "100%",
      backgroundColor: "var(--bg-app)",
      padding: "16px",
      borderRadius: "16px",
      border: "1px solid var(--border)"
    }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
        Your Workspaces
      </div>

      {workspaces.map((ws) => (
        <div
          key={ws.id}
          onClick={() => onSelectWorkspace && onSelectWorkspace(ws.id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            backgroundColor: ws.id === activeWorkspaceId ? "rgba(212, 175, 55, 0.12)" : "var(--bg-card)",
            border: ws.id === activeWorkspaceId ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: "700",
              fontSize: "14px"
            }}>
              <Building2 size={18} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-title)" }}>{ws.name}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Role: {ws.role}</span>
            </div>
          </div>

          {ws.id === activeWorkspaceId && (
            <Check size={18} color="var(--accent-gold)" />
          )}
        </div>
      ))}

      <button
        onClick={onAddNewWorkspace}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px",
          borderRadius: "10px",
          backgroundColor: "transparent",
          color: "var(--accent-gold)",
          border: "1px dashed var(--accent-gold)",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          marginTop: "4px",
          transition: "background-color 0.2s"
        }}
      >
        <Plus size={16} /> Create / Join Another Workspace
      </button>
    </div>
  );
};

export default WorkspaceSelector;
