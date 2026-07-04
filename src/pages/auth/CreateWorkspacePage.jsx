import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import WorkspaceCreationForm from "../../components/auth/WorkspaceCreationForm";

const CreateWorkspacePage = ({ onNavigate }) => {
  return (
    <AuthCard maxWidth="520px" padding="36px 32px">
      <WorkspaceCreationForm
        onBack={() => onNavigate("welcome")}
        onSuccess={() => {
          // Authentication state is resolved in useAuth, App will re-render and mount WorkspaceProvider
        }}
      />
    </AuthCard>
  );
};

export default CreateWorkspacePage;
