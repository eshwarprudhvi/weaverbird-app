import React from "react";
import { APPLICATION } from "../../config/application";

const AuthFooter = () => {
  return (
    <div style={{
      marginTop: "32px",
      textAlign: "center",
      fontSize: "12px",
      color: "var(--text-muted)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      alignItems: "center"
    }}>
      <div style={{ display: "flex", gap: "16px", fontWeight: "500" }}>
        <span style={{ cursor: "pointer", transition: "color 0.2s" }} className="auth-footer-link">Privacy Policy</span>
        <span>•</span>
        <span style={{ cursor: "pointer", transition: "color 0.2s" }} className="auth-footer-link">Terms of Service</span>
        <span>•</span>
        <span style={{ cursor: "pointer", transition: "color 0.2s" }} className="auth-footer-link">Help Center</span>
      </div>
      <div style={{ opacity: 0.7, fontSize: "11px" }}>
        © {new Date().getFullYear()} {APPLICATION.name} v{APPLICATION.version}. All rights reserved.
      </div>
    </div>
  );
};

export default AuthFooter;
