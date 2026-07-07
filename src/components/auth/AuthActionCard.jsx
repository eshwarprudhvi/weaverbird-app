import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";

const AuthActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  isPrimary = false,
  badge = null,
  isLoading = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onClick={isLoading ? undefined : onClick}
      onMouseEnter={() => !isLoading && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 20px",
        borderRadius: "16px",
        backgroundColor: isPrimary 
          ? (isHovered && !isLoading ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.08)")
          : (isHovered && !isLoading ? "var(--bg-app)" : "var(--bg-card)"),
        border: isPrimary 
          ? "1.5px solid var(--accent-gold)" 
          : "1px solid var(--border)",
        boxShadow: isHovered && !isLoading
          ? "0 8px 20px rgba(0, 0, 0, 0.15)" 
          : "0 2px 8px rgba(0, 0, 0, 0.05)",
        cursor: isLoading ? "wait" : "pointer",
        opacity: isLoading ? 0.8 : 1,
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isHovered && !isLoading ? "translateY(-2px)" : "none",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {Icon && (
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            backgroundColor: isPrimary ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isPrimary ? "#000" : "var(--accent-gold)",
            transition: "transform 0.2s",
            transform: isHovered && !isLoading ? "scale(1.08)" : "none"
          }}>
            {isLoading ? <Loader2 size={22} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : <Icon size={22} />}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              fontSize: "15px",
              fontWeight: "700",
              color: isPrimary ? "var(--accent-gold)" : "var(--text-title)",
              letterSpacing: "-0.2px"
            }}>
              {title}
            </span>
            {badge && (
              <span style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "100px",
                backgroundColor: "rgba(212, 175, 55, 0.2)",
                color: "var(--accent-gold)",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <span style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: "1.4",
              maxWidth: "280px"
            }}>
              {description}
            </span>
          )}
        </div>
      </div>

      <div style={{
        color: isPrimary ? "var(--accent-gold)" : "var(--text-muted)",
        transition: "transform 0.2s, color 0.2s",
        transform: isHovered && !isLoading ? "translateX(3px)" : "none",
        display: "flex",
        alignItems: "center"
      }}>
        {isLoading ? (
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <ChevronRight size={20} />
        )}
      </div>
    </div>
  );
};

export default AuthActionCard;
