import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import JoinWorkspaceForm from "../../components/auth/JoinWorkspaceForm";

const JoinWorkspacePage = ({ onNavigate }) => {
  return (
    <AuthCard maxWidth="480px" padding="36px 32px">
      <JoinWorkspaceForm
        onBack={() => onNavigate("welcome")}
        onSuccess={() => {
          // Authentication state is resolved in useAuth, App will mount WorkspaceProvider
        }}
      />
    </AuthCard>
  );
};

export default JoinWorkspacePage;
