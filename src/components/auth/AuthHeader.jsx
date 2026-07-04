import React from "react";
import { APPLICATION } from "../../config/application";

const AuthHeader = ({ title, subtitle }) => {
  return (
    <div style={{ textAlign: "center", marginBottom: "28px" }}>
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "20px",
        margin: "0 auto 16px auto",
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))",
        border: "1px solid rgba(212, 175, 55, 0.4)",
        boxShadow: "0 8px 24px rgba(212, 175, 55, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "26px",
        fontWeight: "800",
        fontFamily: "'Playfair Display', 'Cinzel', serif",
        color: "var(--accent-gold)",
        letterSpacing: "-1px"
      }}>
        {APPLICATION.shortName}
      </div>
      <div style={{
        fontSize: "11px",
        fontWeight: "700",
        color: "var(--accent-gold)",
        textTransform: "uppercase",
        letterSpacing: "2.5px",
        marginBottom: "6px"
      }}>
        {APPLICATION.name}
      </div>
      {title && (
        <h1 style={{
          fontSize: "26px",
          fontWeight: "800",
          color: "var(--text-title)",
          margin: "0 0 8px 0",
          letterSpacing: "-0.5px"
        }}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          margin: 0,
          lineHeight: "1.5",
          maxWidth: "360px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AuthHeader;
