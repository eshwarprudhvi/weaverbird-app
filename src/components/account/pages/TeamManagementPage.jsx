import React from 'react';
import { ChevronLeft, Shield } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { inviteMember, updateMemberRole, removeMember } from '../../../api/workspace.api';
import WorkspaceOverviewCard from '../WorkspaceOverviewCard';

const TeamManagementPage = ({ onBack, authorizedUsers = [], userEmail, db, projectsCount = 0, storageUsed = "0 B", lastSyncText = "Just now", connectionState, onRetry }) => {
  return (
    <div className="screen-content fade-in" style={{ padding: '0 0 80px 0', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: 'var(--bg-nav-solid)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', marginRight: '16px' }}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>Manage Workspace</h2>
      </div>

      <div style={{ padding: '20px' }}>
        <WorkspaceOverviewCard
          projectsCount={projectsCount}
          membersCount={authorizedUsers.length || 1}
          storageUsed={storageUsed}
          lastSyncText={lastSyncText}
          connectionState={connectionState}
          onRetry={onRetry}
        />

        {/* Invite Section */}
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--accent-gold)" /> Invite Partner
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              id="invite-email-input"
              type="email"
              placeholder="partner@example.com"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13.5px", outline: "none" }}
            />
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              <select
                id="invite-role-select"
                defaultValue="editor"
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "13px", outline: "none" }}
              >
                <option value="editor">Editor Access</option>
                <option value="admin">Admin Access</option>
              </select>
              <button
                onClick={async () => {
                  const emailEl = document.getElementById("invite-email-input");
                  const roleEl = document.getElementById("invite-role-select");
                  const emailVal = emailEl?.value?.toLowerCase()?.trim();
                  const roleVal = roleEl?.value;
                  if (!emailVal || !emailVal.includes("@")) { alert("Please enter a valid email to invite."); return; }
                  try {
                    await inviteMember(localStorage.getItem('wb_active_workspace_id'), emailVal, roleVal);
                    alert(`Successfully granted ${roleVal} access to ${emailVal}!`);
                    if (emailEl) emailEl.value = "";
                  } catch (err) { alert(`Failed to add user: ${err.message}`); }
                }}
                style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: "var(--accent-gold-dark)", color: "white", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* User List */}
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "12px", textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Authorized Users ({authorizedUsers.length})
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {authorizedUsers.map(u => (
              <div key={u.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: '4px' }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>{u.email}</span>
                  <span style={{ fontSize: "12px", color: "var(--accent-gold)", fontWeight: 600 }}>{u.role.toUpperCase()}</span>
                </div>
                {u.email !== (userEmail || "").toLowerCase().trim() ? (
                  <div style={{ display: "flex", flexDirection: 'column', gap: "8px", alignItems: 'flex-end' }}>
                    <select
                      value={u.role}
                      onChange={async (e) => {
                        try { 
                          await updateMemberRole(localStorage.getItem('wb_active_workspace_id'), u.email, e.target.value);
                        } catch (err) {
                          alert(`Failed to update role: ${err.message}`); 
                        }
                      }}
                      style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--bg-app)", color: "var(--text-main)", fontSize: "12px" }}
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to revoke access for ${u.email}?`)) {
                          try { 
                            await removeMember(localStorage.getItem('wb_active_workspace_id'), u.email); 
                          } catch(err) {
                            alert(`Failed to revoke access: ${err.message}`); 
                          }
                        }
                      }}
                      style={{ padding: "4px 12px", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                    >
                      Revoke
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", backgroundColor: 'var(--bg-app)', padding: '4px 12px', borderRadius: '12px' }}>You</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
