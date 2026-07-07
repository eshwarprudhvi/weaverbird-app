import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Shield, Users, Mail, Search, Filter, RefreshCw, XCircle, Clock, CheckCircle, Plus, AlertTriangle, UserCheck } from 'lucide-react';
import { updateMemberRole, removeMember } from '../../../api/workspace.api';
import WorkspaceOverviewCard from '../WorkspaceOverviewCard';
import InviteMemberModal from '../modals/InviteMemberModal';
import invitationRepository from '../../../repositories/InvitationRepository';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'expired', label: 'Expired' },
  { id: 'cancelled', label: 'Cancelled' }
];

const ROLE_FILTERS = [
  { id: 'all', label: 'All Roles' },
  { id: 'owner', label: 'Owner' },
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Manager' },
  { id: 'editor', label: 'Editor' },
  { id: 'member', label: 'Member' },
  { id: 'viewer', label: 'Viewer' }
];

const TeamManagementPage = ({ onBack, authorizedUsers = [], userEmail, db, projectsCount = 0, storageUsed = "0 B", lastSyncText = "Just now", connectionState, onRetry }) => {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'invitations'
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const workspaceId = localStorage.getItem('wb_active_workspace_id');

  const fetchInvitations = async () => {
    if (!workspaceId) return;
    setLoadingInvites(true);
    try {
      const data = await invitationRepository.listByWorkspace(workspaceId);
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab, workspaceId]);

  const handleResend = async (invitation) => {
    if (!invitation?.id) return;
    setActionLoadingId(invitation.id);
    try {
      await invitationRepository.resend(invitation.id);
      await fetchInvitations();
    } catch (err) {
      alert(`Failed to resend invitation: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (invitation) => {
    if (!invitation?.id) return;
    if (!confirm(`Are you sure you want to cancel the invitation for ${invitation.email}?`)) return;
    setActionLoadingId(invitation.id);
    try {
      await invitationRepository.cancel(invitation.id);
      await fetchInvitations();
    } catch (err) {
      alert(`Failed to cancel invitation: ${err?.message || 'Unknown error'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter and Search invitations
  const filteredInvitations = useMemo(() => {
    return invitations.filter(inv => {
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesRole = roleFilter === 'all' || (inv.role && inv.role.toLowerCase() === roleFilter);
      const matchesSearch = !searchQuery || (inv.email && inv.email.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [invitations, statusFilter, roleFilter, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15', fontSize: '12px', fontWeight: '600' }}><Clock size={13} /> Pending</span>;
      case 'accepted':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '12px', fontWeight: '600' }}><CheckCircle size={13} /> Accepted</span>;
      case 'expired':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', fontSize: '12px', fontWeight: '600' }}><AlertTriangle size={13} /> Expired</span>;
      case 'cancelled':
      default:
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}><XCircle size={13} /> Cancelled</span>;
    }
  };

  const formatRoleDisplay = (roleStr) => {
    if (!roleStr) return 'Member';
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
  };

  const currentUser = useMemo(() => {
    return authorizedUsers.find(u => u.email === (userEmail || '').toLowerCase().trim());
  }, [authorizedUsers, userEmail]);
  
  const isWorkspaceAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-nav-solid)',
        borderBottom: '1px solid var(--border)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>Team & Workspace Management</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Manage members, roles, and invitations</p>
          </div>
        </div>

        {isWorkspaceAdmin && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            <Plus size={15} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="screen-content fade-in" style={{ padding: '20px 20px 120px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <WorkspaceOverviewCard
          projectsCount={projectsCount}
          membersCount={authorizedUsers.length || 1}
          storageUsed={storageUsed}
          lastSyncText={lastSyncText}
          connectionState={connectionState}
          onRetry={onRetry}
        />

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          margin: '28px 0 20px 0',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px'
        }}>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'members' ? 'var(--accent-gold-dark, #6366f1)' : 'transparent',
              color: activeTab === 'members' ? '#fff' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} />
            <span>Active Members ({authorizedUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: activeTab === 'invitations' ? 'var(--accent-gold-dark, #6366f1)' : 'transparent',
              color: activeTab === 'invitations' ? '#fff' : 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Mail size={16} />
            <span>Invitations & Onboarding</span>
          </button>
        </div>

        {/* TAB 1: MEMBERS */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Workspace Collaborators
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Access changes apply immediately
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authorizedUsers.map(u => (
                <div key={u.email} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '18px 20px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      {(u.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: 'var(--text-main)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }} title={u.email}>
                        {u.email}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600', background: 'rgba(129, 140, 248, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                          {formatRoleDisplay(u.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {u.role === 'owner' ? (
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--accent-gold-dark)', 
                      fontWeight: '700', 
                      backgroundColor: 'rgba(212, 163, 89, 0.12)', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid rgba(212, 163, 89, 0.2)',
                      whiteSpace: 'nowrap'
                    }}>
                      Workspace Owner
                    </span>
                  ) : u.email !== (userEmail || '').toLowerCase().trim() ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <select
                        value={u.role ? u.role.toLowerCase() : 'editor'}
                        onChange={async (e) => {
                          try { 
                            await updateMemberRole(workspaceId, u.email, e.target.value);
                          } catch (err) {
                            alert(`Failed to update role: ${err.message}`); 
                          }
                        }}
                        style={{
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '12px',
                          outline: 'none',
                          cursor: 'pointer',
                          maxWidth: '90px'
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="editor">Editor</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to revoke access for ${u.email}?`)) {
                            try { 
                              await removeMember(workspaceId, u.email); 
                            } catch(err) {
                              alert(`Failed to revoke access: ${err.message}`); 
                            }
                          }
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Revoke
                      </button>
                    </div>
                  ) : (
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-muted)', 
                      fontStyle: 'italic', 
                      backgroundColor: 'var(--bg-app)', 
                      padding: '6px 12px', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border)',
                      whiteSpace: 'nowrap'
                    }}>
                      You (Current Session)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: INVITATIONS */}
        {activeTab === 'invitations' && (
          <div>
            {/* Filter and Search Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search invitations by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {STATUS_FILTERS.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {ROLE_FILTERS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>

                <button
                  onClick={fetchInvitations}
                  title="Refresh invitations"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <RefreshCw size={15} className={loadingInvites ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* List of Invitations */}
            {loadingInvites ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span>Loading workspace invitations...</span>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div style={{
                padding: '48px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '14px',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Mail size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>No Invitations Found</h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px' }}>
                  {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                    ? 'No invitations match your current filter criteria.'
                    : 'Get started by inviting colleagues to collaborate on this workspace.'}
                </p>
                {isWorkspaceAdmin && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    style={{
                      marginTop: '8px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent-gold-dark, #6366f1)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Send First Invitation
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredInvitations.map(inv => (
                  <div key={inv.id} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px', flex: '1 1 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', wordBreak: 'break-all' }}>{inv.email}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Role: <strong style={{ color: 'var(--text-main)' }}>{formatRoleDisplay(inv.role)}</strong></span>
                        <span>Invited by: <strong>{inv.invitedBy || 'Admin'}</strong></span>
                        {inv.expiresAt && inv.status === 'pending' && (
                          <span>Expires: <strong>{new Date(inv.expiresAt).toLocaleDateString()}</strong></span>
                        )}
                      </div>
                      {inv.message && (
                        <div style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontStyle: 'italic',
                          background: 'var(--bg-app)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          marginTop: '4px',
                          borderLeft: '2px solid #6366f1'
                        }}>
                          "{inv.message}"
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {isWorkspaceAdmin && (inv.status === 'pending' || inv.status === 'expired') && (
                        <button
                          onClick={() => handleResend(inv)}
                          disabled={actionLoadingId === inv.id}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: actionLoadingId === inv.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RefreshCw size={13} className={actionLoadingId === inv.id ? 'spin' : ''} />
                          <span>{actionLoadingId === inv.id ? 'Working...' : 'Resend'}</span>
                        </button>
                      )}

                      {isWorkspaceAdmin && inv.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(inv)}
                          disabled={actionLoadingId === inv.id}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: actionLoadingId === inv.id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={workspaceId}
        onInviteSuccess={() => {
          if (activeTab === 'invitations') {
            fetchInvitations();
          } else {
            setActiveTab('invitations');
          }
        }}
      />
    </div>
  </div>
  );
};

export default TeamManagementPage;
