import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import WorkspaceSelector from "../../components/auth/WorkspaceSelector";

const WorkspaceSwitcherPage = ({ onNavigate }) => {
  return (
    <AuthCard maxWidth="520px" padding="36px 32px">
      <AuthHeader title="Switch Workspace" subtitle="Select which studio workspace you want to open." />
      <WorkspaceSelector
        onSelectWorkspace={(wsId) => {
          // Future switching logic
          if (onNavigate) onNavigate("welcome");
        }}
        onAddNewWorkspace={() => {
          if (onNavigate) onNavigate("create");
        }}
      />
    </AuthCard>
  );
};

export default WorkspaceSwitcherPage;
