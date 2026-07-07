import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Plus, Trash2, RotateCcw, Save, Check, Loader2, Home, Lock } from 'lucide-react';
import { useWorkspace } from '../../../contexts/WorkspaceContext';

const SYSTEM_DEFAULT_ROOMS = [];

const DefaultRoomsSettingsPage = ({ onBack, authorizedUsers = [], userEmail }) => {
  const { workspace, updateWorkspace, status } = useWorkspace();
  const [rooms, setRooms] = useState([...SYSTEM_DEFAULT_ROOMS]);
  const [newRoomInput, setNewRoomInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine if current user is admin/owner
  const isWorkspaceAdmin = useMemo(() => {
    if (!authorizedUsers || authorizedUsers.length === 0) return true; // Local/Demo mode
    const currentUser = authorizedUsers.find(u => u.email === (userEmail || '').toLowerCase().trim());
    if (!currentUser) return true; // Fallback if user not found in list
    return currentUser.role === 'admin' || currentUser.role === 'owner';
  }, [authorizedUsers, userEmail]);

  useEffect(() => {
    if (workspace && Array.isArray(workspace.defaultRooms)) {
      setRooms([...workspace.defaultRooms]);
    } else {
      setRooms([...SYSTEM_DEFAULT_ROOMS]);
    }
  }, [workspace]);

  const handleAddRoom = (e) => {
    if (e) e.preventDefault();
    const trimmed = newRoomInput.trim();
    if (!trimmed) return;
    if (rooms.includes(trimmed)) {
      setErrorMsg(`"${trimmed}" is already in the default rooms list.`);
      return;
    }
    setErrorMsg('');
    setRooms([...rooms, trimmed]);
    setNewRoomInput('');
  };

  const handleRemoveRoom = (roomToRemove) => {
    setErrorMsg('');
    setRooms(rooms.filter(r => r !== roomToRemove));
  };

  const handleResetToSystemDefaults = () => {
    setErrorMsg('');
    setRooms([...SYSTEM_DEFAULT_ROOMS]);
  };

  const handleSave = async () => {
    if (!isWorkspaceAdmin) return;
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      await updateWorkspace({ defaultRooms: rooms });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("Failed to save default rooms. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-nav-solid)',
        borderBottom: '1px solid var(--border)',
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', marginRight: '16px' }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Home size={18} style={{ color: 'var(--accent-gold)' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-title)' }}>Default Project Rooms</h2>
        </div>
        {status === 'offline' && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>Offline Mode</span>
        )}
      </div>

      <div className="screen-content fade-in" style={{ padding: '20px', overflowY: 'auto', paddingBottom: '120px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Template Configuration
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
            These room templates will be pre-selected automatically whenever any member of this workspace creates a new interior design project.
          </p>

          {!isWorkspaceAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#f59e0b', marginBottom: '20px', fontSize: '13px', fontWeight: 500 }}>
              <Lock size={18} style={{ flexShrink: 0 }} />
              <span>Only Workspace Owners and Admins can customize default room templates.</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          {/* Add Room Input (Admin only) */}
          {isWorkspaceAdmin && (
            <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Add room template (e.g., Master Bathroom, Balcony)" 
                value={newRoomInput}
                onChange={(e) => setNewRoomInput(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--bg-card)', 
                  color: 'var(--text-main)', 
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{ 
                  padding: '0 20px', 
                  borderRadius: '12px', 
                  backgroundColor: 'var(--accent-gold-dark)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </form>
          )}

          {/* Rooms Grid / Chips */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-title)' }}>
                Active Templates ({rooms.length})
              </span>
              {isWorkspaceAdmin && (
                <button 
                  type="button"
                  onClick={handleResetToSystemDefaults}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Clear all default room templates"
                >
                  <RotateCcw size={13} />
                  <span>Clear All Templates</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {rooms.map((room, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 14px', 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '24px', 
                    fontSize: '14px', 
                    fontWeight: 500,
                    color: 'var(--text-title)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <span>{room}</span>
                  {isWorkspaceAdmin && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveRoom(room)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        cursor: 'pointer', 
                        padding: 0, 
                        display: 'flex', 
                        alignItems: 'center',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title={`Remove ${room}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          {isWorkspaceAdmin && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{ 
                width: '100%', 
                padding: '16px', 
                borderRadius: '14px', 
                backgroundColor: saveSuccess ? '#10b981' : 'var(--accent-gold-dark)', 
                color: 'white', 
                border: 'none', 
                fontSize: '15px', 
                fontWeight: 600, 
                cursor: isSaving ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '8px',
                opacity: isSaving ? 0.7 : 1,
                boxShadow: saveSuccess ? '0 4px 12px rgba(16, 185, 129, 0.25)' : '0 4px 12px rgba(212, 175, 55, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={20} className="spinner-mini" />
                  Saving Templates...
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={20} />
                  Default Rooms Updated!
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Default Rooms
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultRoomsSettingsPage;
