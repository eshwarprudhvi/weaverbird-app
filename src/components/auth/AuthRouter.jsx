import React, { useState, useEffect } from "react";
import AuthLayout from "./AuthLayout";
import WelcomePage from "../../pages/auth/WelcomePage";
import LoginPage from "../../pages/auth/LoginPage";
import CreateWorkspacePage from "../../pages/auth/CreateWorkspacePage";
import WorkspaceInvitationsPage from "../../pages/auth/WorkspaceInvitationsPage";
import YoureAlmostReadyPage from "../../pages/auth/YoureAlmostReadyPage";
import ForgotPasswordPage from "../../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../../pages/auth/ResetPasswordPage";
import WorkspaceSwitcherPage from "../../pages/auth/WorkspaceSwitcherPage";

const AuthRouter = ({ initialRoute = "welcome", onWorkspaceSelected }) => {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);

  // Sync with parent when initialRoute prop changes (e.g., after auth check)
  useEffect(() => {
    setCurrentRoute(initialRoute);
  }, [initialRoute]);

  const renderPage = () => {
    switch (currentRoute) {
      case "welcome":
        return <WelcomePage onNavigate={setCurrentRoute} />;
      case "login":
        return <LoginPage onNavigate={setCurrentRoute} />;
      case "create":
        return <CreateWorkspacePage onNavigate={setCurrentRoute} onWorkspaceSelected={onWorkspaceSelected} />;
      case "pending-invitations":
        return <WorkspaceInvitationsPage onNavigate={setCurrentRoute} onWorkspaceSelected={onWorkspaceSelected} />;
      case "no-workspace":
        return <YoureAlmostReadyPage onNavigate={setCurrentRoute} onWorkspaceSelected={onWorkspaceSelected} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={setCurrentRoute} />;
      case "reset-password":
        return <ResetPasswordPage onNavigate={setCurrentRoute} />;
      case "switch":
        return <WorkspaceSwitcherPage onNavigate={setCurrentRoute} onWorkspaceSelected={onWorkspaceSelected} />;
      default:
        return <WelcomePage onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <AuthLayout>
      {renderPage()}
    </AuthLayout>
  );
};

export default AuthRouter;
