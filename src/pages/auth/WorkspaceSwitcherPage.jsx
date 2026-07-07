import React from "react";
import { HardDrive } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import WorkspaceSelector from "../../components/auth/WorkspaceSelector";
import useAuth from "../../hooks/useAuth";

const WorkspaceSwitcherPage = ({ onNavigate, onWorkspaceSelected }) => {
  const { continueOffline } = useAuth();

  const handleWorkspaceSelected = () => {
    if (onWorkspaceSelected) onWorkspaceSelected();
  };

  const handleContinueOffline = () => {
    continueOffline();
    if (onWorkspaceSelected) onWorkspaceSelected();
  };

  return (
    <AuthCard maxWidth="520px" padding="36px 32px">
      <AuthHeader title="Your Workspaces" subtitle="Select a workspace to open, or continue in offline mode." />
      <WorkspaceSelector
        onSelectWorkspace={handleWorkspaceSelected}
        onAddNewWorkspace={() => {
          if (onNavigate) onNavigate("create");
        }}
      />

      <div style={{ marginTop: "16px", borderTop: "1px dashed var(--border)", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
        <button
          onClick={handleContinueOffline}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: "13px",
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: "8px",
            transition: "color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.color = "var(--text-title)"}
          onMouseOut={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <HardDrive size={15} />
          Continue in Offline / Local Mode
        </button>
      </div>
    </AuthCard>
  );
};

export default WorkspaceSwitcherPage;
