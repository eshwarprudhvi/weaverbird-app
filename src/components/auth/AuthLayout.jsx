import React from "react";
import AuthFooter from "./AuthFooter";

const AuthLayout = ({ children }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "var(--bg-app)",
      color: "var(--text-main)",
      padding: "24px 16px",
      position: "relative",
      overflowX: "hidden",
      fontFamily: "var(--font-body)"
    }}>
      {/* Background Subtle Gradient & Glow */}
      <div style={{
        position: "absolute",
        top: "-10%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "400px",
        background: "radial-gradient(circle, rgba(212, 175, 55, 0.07) 0%, rgba(0, 0, 0, 0) 70%)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Main Container */}
      <div style={{
        width: "100%",
        maxWidth: "480px",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        {children}
        <AuthFooter />
      </div>
    </div>
  );
};

export default AuthLayout;
