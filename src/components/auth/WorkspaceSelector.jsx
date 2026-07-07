import React, { useState, useEffect } from "react";
import { Building2, Check, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { failedWorkspaceIds } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

/**
 * Component for Dynamic Multi-Workspace Switching
 * When a user belongs to multiple workspaces (Workspace A, Workspace B, Workspace C),
 * this component displays their available workspaces and allows switching.
 */
const WorkspaceSelector = ({ onSelectWorkspace, onAddNewWorkspace }) => {
  const { activeWorkspaceId, user, isLocalMode, switchWorkspace } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLocalMode || !user?.email) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const loadWorkspaces = async () => {
      setLoading(true);
      try {
        const list = [];
        const seenIds = new Set();

        // 1. Fetch all accepted invitations for the user's email
        const q = query(
          collection(db, "invitations"),
          where("email", "==", user.email.trim().toLowerCase()),
          where("status", "==", "accepted")
        );
        const inviteSnap = await getDocs(q);

        // 2. Fetch workspaceIndex from Firestore for the user to restore active/owned workspace
        let indexedWorkspaceId = activeWorkspaceId;
        let indexedRole = user?.role || "member";
        
        try {
          const indexSnap = await getDoc(doc(db, 'workspaceIndex', user.uid));
          if (indexSnap.exists()) {
            const data = indexSnap.data();
            if (data.status === 'active' && data.workspaceId && !failedWorkspaceIds.has(data.workspaceId)) {
              indexedWorkspaceId = data.workspaceId;
              indexedRole = data.role || 'member';
            }
          }
        } catch (e) {
          console.warn("Failed to fetch workspace index in selector:", e);
        }

        // 3. Add the resolved indexed workspace (or current active workspace) if any
        const targetWsId = indexedWorkspaceId || activeWorkspaceId;
        if (targetWsId && !failedWorkspaceIds.has(targetWsId)) {
          try {
            const activeWsSnap = await getDoc(doc(db, "workspaces", targetWsId));
            if (activeWsSnap.exists()) {
              list.push({
                id: targetWsId,
                name: activeWsSnap.data().companyName || activeWsSnap.data().name || "Active Workspace",
                role: indexedRole
              });
              seenIds.add(targetWsId);
            }
          } catch (e) {
            console.warn("Failed to fetch active workspace info:", e);
            list.push({ id: targetWsId, name: "Active Workspace", role: indexedRole });
            seenIds.add(targetWsId);
          }
        }

        // 3. Resolve other workspaces from accepted invitations
        for (const inviteDoc of inviteSnap.docs) {
          const data = inviteDoc.data();
          const wsId = data.workspaceId;
          if (wsId && !seenIds.has(wsId) && !failedWorkspaceIds.has(wsId)) {
            try {
              const wsSnap = await getDoc(doc(db, "workspaces", wsId));
              if (wsSnap.exists()) {
                list.push({
                  id: wsId,
                  name: wsSnap.data().companyName || wsSnap.data().name || "Workspace",
                  role: data.role || "member"
                });
                seenIds.add(wsId);
              }
            } catch (e) {
              console.warn(`Failed to fetch workspace info for ${wsId}:`, e);
              list.push({
                id: wsId,
                name: data.workspaceName || "Workspace",
                role: data.role || "member"
              });
              seenIds.add(wsId);
            }
          }
        }

        if (isMounted) {
          setWorkspaces(list);
        }
      } catch (err) {
        console.error("Failed to load workspaces list:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, user?.email, isLocalMode]);

  const handleSelectWorkspace = async (wsId) => {
    if (wsId === activeWorkspaceId) {
      // Already the active workspace — just confirm selection to open it
      if (onSelectWorkspace) onSelectWorkspace(wsId);
      return;
    }
    if (onSelectWorkspace) {
      await switchWorkspace(wsId);
      onSelectWorkspace(wsId);
    } else {
      await switchWorkspace(wsId);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
        Loading workspaces...
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      width: "100%",
      backgroundColor: "var(--bg-app)",
      padding: "16px",
      borderRadius: "16px",
      border: "1px solid var(--border)"
    }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
        Your Workspaces
      </div>

      {workspaces.length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.6" }}>
          No workspaces found. Create a new workspace or wait for an invitation.
        </div>
      )}

      {workspaces.map((ws) => (
        <div
          key={ws.id}
          onClick={() => handleSelectWorkspace(ws.id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            borderRadius: "12px",
            backgroundColor: ws.id === activeWorkspaceId ? "rgba(212, 175, 55, 0.12)" : "var(--bg-card)",
            border: ws.id === activeWorkspaceId ? "1px solid var(--accent-gold)" : "1px solid var(--border)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: "700",
              fontSize: "14px"
            }}>
              <Building2 size={18} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-title)" }}>{ws.name}</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Role: {ws.role}</span>
            </div>
          </div>

          {ws.id === activeWorkspaceId && (
            <Check size={18} color="var(--accent-gold)" />
          )}
        </div>
      ))}

      <button
        onClick={onAddNewWorkspace}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "10px",
          borderRadius: "10px",
          backgroundColor: "transparent",
          color: "var(--accent-gold)",
          border: "1px dashed var(--accent-gold)",
          fontSize: "13px",
          fontWeight: "600",
          cursor: "pointer",
          marginTop: "4px",
          transition: "background-color 0.2s"
        }}
      >
        <Plus size={16} /> Create / Join Another Workspace
      </button>
    </div>
  );
};

export default WorkspaceSelector;
