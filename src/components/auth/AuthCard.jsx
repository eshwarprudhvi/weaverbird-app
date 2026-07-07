import React from "react";

const AuthCard = ({ children, maxWidth = "440px", padding = "36px 32px" }) => {
  return (
    <div style={{
      width: "100%",
      maxWidth: maxWidth,
      backgroundColor: "var(--bg-card)",
      borderRadius: "24px",
      border: "1px solid var(--border)",
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25), 0 0 1px rgba(255, 255, 255, 0.1) inset",
      padding: padding,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      transition: "all 0.3s ease",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      {/* Top Gold Accent Border Line */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)"
      }} />
      {children}
    </div>
  );
};

export default AuthCard;
