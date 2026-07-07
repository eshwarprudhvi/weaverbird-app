import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import WorkspaceCreationForm from "../../components/auth/WorkspaceCreationForm";

const CreateWorkspacePage = ({ onNavigate, onWorkspaceSelected }) => {
  return (
    <AuthCard maxWidth="520px" padding="36px 32px">
      <WorkspaceCreationForm
        onBack={() => onNavigate("no-workspace")}
        onSuccess={() => {
          // Workspace registered — confirm the session gate is passed
          if (onWorkspaceSelected) onWorkspaceSelected();
        }}
      />
    </AuthCard>
  );
};

export default CreateWorkspacePage;
