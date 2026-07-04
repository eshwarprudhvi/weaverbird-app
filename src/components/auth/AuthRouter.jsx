import React, { useState } from "react";
import AuthLayout from "./AuthLayout";
import WelcomePage from "../../pages/auth/WelcomePage";
import LoginPage from "../../pages/auth/LoginPage";
import CreateWorkspacePage from "../../pages/auth/CreateWorkspacePage";
import JoinWorkspacePage from "../../pages/auth/JoinWorkspacePage";
import ForgotPasswordPage from "../../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../../pages/auth/ResetPasswordPage";
import WorkspaceSwitcherPage from "../../pages/auth/WorkspaceSwitcherPage";

const AuthRouter = ({ initialRoute = "welcome" }) => {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);

  const renderPage = () => {
    switch (currentRoute) {
      case "welcome":
        return <WelcomePage onNavigate={setCurrentRoute} />;
      case "login":
        return <LoginPage onNavigate={setCurrentRoute} />;
      case "create":
        return <CreateWorkspacePage onNavigate={setCurrentRoute} />;
      case "join":
        return <JoinWorkspacePage onNavigate={setCurrentRoute} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={setCurrentRoute} />;
      case "reset-password":
        return <ResetPasswordPage onNavigate={setCurrentRoute} />;
      case "switch":
        return <WorkspaceSwitcherPage onNavigate={setCurrentRoute} />;
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
