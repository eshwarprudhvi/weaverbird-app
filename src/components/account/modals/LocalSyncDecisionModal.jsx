import React, { useState } from "react";
import { createPortal } from "react-dom";
import { CloudUpload, HardDrive, CheckSquare, AlertTriangle, ArrowRight, Check } from "lucide-react";

const LocalSyncDecisionModal = ({
  isOpen,
  localProjects = [],
  onDecision, // (strategy: "UPLOAD_ALL" | "KEEP_LOCAL" | "CHOOSE", selectedIds?: string[]) => void
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState("UPLOAD_ALL"); // "UPLOAD_ALL" | "KEEP_LOCAL" | "CHOOSE"
  const [selectedProjectIds, setSelectedProjectIds] = useState(() =>
    localProjects.map((p) => p.id)
  );

  if (!isOpen || localProjects.length === 0) return null;

  const target = typeof document !== 'undefined' ? (document.getElementById('app-root') || document.body) : null;
  if (!target) return null;

  const handleToggleProject = (id) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedStrategy === "CHOOSE") {
      onDecision("CHOOSE", selectedProjectIds);
    } else {
      onDecision(selectedStrategy);
    }
  };

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        className="fade-in"
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 24px 16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div
              style={{
                padding: "10px",
                borderRadius: "12px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-title)", margin: 0 }}>
                Local Projects Found
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                {localProjects.length} project{localProjects.length === 1 ? "" : "s"} stored on this device
              </span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, margin: "8px 0 0 0" }}>
            We found local projects created in offline mode. Choose how you would like to handle this data with your connected workspace.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* Strategy Option 1: Upload All */}
          <div
            onClick={() => setSelectedStrategy("UPLOAD_ALL")}
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              border: selectedStrategy === "UPLOAD_ALL" ? "2px solid var(--accent-blue)" : "1px solid var(--border)",
              backgroundColor: selectedStrategy === "UPLOAD_ALL" ? "rgba(59, 130, 246, 0.08)" : "var(--bg-app)",
              cursor: "pointer",
              marginBottom: "12px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ marginTop: "2px", color: selectedStrategy === "UPLOAD_ALL" ? "var(--accent-blue)" : "var(--text-muted)" }}>
              <CloudUpload size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-title)", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Upload Local Projects</span>
                {selectedStrategy === "UPLOAD_ALL" && <Check size={16} color="var(--accent-blue)" />}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Merge and upload all {localProjects.length} local project{localProjects.length === 1 ? "" : "s"} to your cloud workspace.
              </div>
            </div>
          </div>

          {/* Strategy Option 2: Keep on This Device */}
          <div
            onClick={() => setSelectedStrategy("KEEP_LOCAL")}
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              border: selectedStrategy === "KEEP_LOCAL" ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
              backgroundColor: selectedStrategy === "KEEP_LOCAL" ? "rgba(245, 158, 11, 0.08)" : "var(--bg-app)",
              cursor: "pointer",
              marginBottom: "12px",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ marginTop: "2px", color: selectedStrategy === "KEEP_LOCAL" ? "var(--accent-gold)" : "var(--text-muted)" }}>
              <HardDrive size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-title)", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Keep on This Device</span>
                {selectedStrategy === "KEEP_LOCAL" && <Check size={16} color="var(--accent-gold)" />}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Store projects locally on this device only. They will not be uploaded or synchronized with your cloud team.
              </div>
            </div>
          </div>

          {/* Strategy Option 3: Choose Projects to Upload */}
          <div
            onClick={() => setSelectedStrategy("CHOOSE")}
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              border: selectedStrategy === "CHOOSE" ? "2px solid #10b981" : "1px solid var(--border)",
              backgroundColor: selectedStrategy === "CHOOSE" ? "rgba(16, 185, 129, 0.08)" : "var(--bg-app)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div style={{ marginTop: "2px", color: selectedStrategy === "CHOOSE" ? "#10b981" : "var(--text-muted)" }}>
              <CheckSquare size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-title)", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Choose Projects to Upload</span>
                {selectedStrategy === "CHOOSE" && <Check size={16} color="#10b981" />}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Review your local projects and select exactly which ones should be synchronized to the cloud.
              </div>
            </div>
          </div>

          {/* Sub-list when CHOOSE is selected */}
          {selectedStrategy === "CHOOSE" && (
            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", backgroundColor: "var(--bg-app)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>Select Projects ({selectedProjectIds.length}/{localProjects.length})</span>
                <span
                  onClick={() => setSelectedProjectIds(selectedProjectIds.length === localProjects.length ? [] : localProjects.map(p => p.id))}
                  style={{ color: "var(--accent-blue)", cursor: "pointer", textTransform: "none" }}
                >
                  {selectedProjectIds.length === localProjects.length ? "Deselect All" : "Select All"}
                </span>
              </div>
              <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                {localProjects.map((proj) => {
                  const isChecked = selectedProjectIds.includes(proj.id);
                  return (
                    <div
                      key={proj.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProject(proj.id);
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: isChecked ? "rgba(16, 185, 129, 0.1)" : "transparent",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-title)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {proj.name || "Untitled Project"}
                      </span>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: isChecked ? "none" : "1px solid var(--border)",
                          backgroundColor: isChecked ? "#10b981" : "var(--bg-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isChecked && <Check size={12} color="white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-app)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={handleConfirm}
            disabled={selectedStrategy === "CHOOSE" && selectedProjectIds.length === 0}
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: selectedStrategy === "CHOOSE" && selectedProjectIds.length === 0 ? "var(--border)" : "var(--accent-gold)",
              color: "white",
              fontWeight: 700,
              fontSize: "14px",
              cursor: selectedStrategy === "CHOOSE" && selectedProjectIds.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <span>Confirm Strategy</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>,
    target
  );
};

export default LocalSyncDecisionModal;
