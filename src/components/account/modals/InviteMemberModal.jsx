import React, { useState } from 'react';
import { X, Mail, Shield, Send, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import invitationRepository from '../../../repositories/InvitationRepository';
import { useWorkspace } from '../../../contexts/WorkspaceContext';
import { db } from '../../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', desc: 'Can manage workspace settings, members, and all projects.' },
  { value: 'manager', label: 'Manager', desc: 'Can manage projects, schedules, and team tasks.' },
  { value: 'editor', label: 'Editor', desc: 'Can create and edit projects, tasks, and upload materials.' },
  { value: 'member', label: 'Member', desc: 'Standard collaborator access to assigned tasks and projects.' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to view projects and documentation.' }
];

const InviteMemberModal = ({ isOpen, onClose, workspaceId, onInviteSuccess }) => {
  const { workspace } = useWorkspace();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter a collaborator email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Check if user is already a workspace member
      const memberQuery = query(
        collection(db, 'workspaces', workspaceId, 'members'),
        where('email', '==', normalizedEmail)
      );
      const memberSnap = await getDocs(memberQuery);
      if (!memberSnap.empty) {
        setError("This user is already a member of this workspace.");
        setLoading(false);
        return;
      }

      // 2. Check if user already has a pending invitation
      const inviteQuery = query(
        collection(db, 'invitations'),
        where('workspaceId', '==', workspaceId),
        where('email', '==', normalizedEmail),
        where('status', '==', 'pending')
      );
      const inviteSnap = await getDocs(inviteQuery);
      if (!inviteSnap.empty) {
        setError("This user already has a pending invitation.");
        setLoading(false);
        return;
      }

      const createdInvite = await invitationRepository.create(workspaceId, {
        email: normalizedEmail,
        role,
        message: "",
        expiresInDays: 7
      });

      setSuccessMsg("Invitation created successfully.");
      setEmail('');
      setRole('member');

      if (onInviteSuccess) {
        onInviteSuccess();
      }

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Firestore create invitation error details:", err);
      setError("Unable to create invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '20px'
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(145deg, #1e2029 0%, #15161c 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden',
        color: '#fff'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-gold, #D4AF37) 0%, var(--accent-gold-dark, #AA7C11) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)'
            }}>
              <UserPlus size={20} color="#1e1b18" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Add Team Member</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Create a workspace invitation for an existing Weaverbird account.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: '#4ade80',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={16} />
                <span style={{ fontWeight: '600' }}>{successMsg}</span>
              </div>
              <p style={{ margin: 0, paddingLeft: '26px', fontSize: '12px', color: '#86efac' }}>
                The invited user will see this invitation automatically after signing in with this email.
              </p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
              <Mail size={15} color="var(--accent-gold, #D4AF37)" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-gold, #D4AF37)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '6px', paddingLeft: '4px' }}>
              Must match the user's Weaverbird account email.
            </span>
          </div>

          {/* Role Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>
              <Shield size={15} color="var(--accent-gold, #D4AF37)" />
              <span>Workspace Role</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: '#181a20',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '12px', color: '#64748b', paddingLeft: '4px' }}>
                {ROLE_OPTIONS.find(o => o.value === role)?.desc}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'transparent',
                color: '#cbd5e1',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent-gold, #D4AF37) 0%, var(--accent-gold-dark, #AA7C11) 100%)',
                color: '#1e1b18',
                fontSize: '14px',
                fontWeight: '700',
                cursor: (loading || successMsg) ? 'not-allowed' : 'pointer',
                opacity: (loading || successMsg) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)'
              }}
            >
              <Send size={16} />
              <span>{loading ? 'Creating...' : 'Create Invitation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
