import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const defaultRoomsList = [];

export default function AddProjectModal({ isOpen, onClose, onAddProject }) {
  const { workspace } = useWorkspace();
  const activeDefaultRooms = (workspace && Array.isArray(workspace.defaultRooms))
    ? workspace.defaultRooms
    : defaultRoomsList;

  const [newProjName, setNewProjName] = useState("");
  const [newProjStatus, setNewProjStatus] = useState("not-started");
  const [newProjCompletionDate, setNewProjCompletionDate] = useState("");
  const [newProjAllAvailableRooms, setNewProjAllAvailableRooms] = useState([...activeDefaultRooms]);
  const [newProjSelectedRooms, setNewProjSelectedRooms] = useState([...activeDefaultRooms]);
  const [newProjCustomRoomInput, setNewProjCustomRoomInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewProjAllAvailableRooms([...activeDefaultRooms]);
      setNewProjSelectedRooms([...activeDefaultRooms]);
    }
  }, [isOpen, workspace]);

  const handleAddCustomRoomToNewProj = () => {
    const r = newProjCustomRoomInput.trim();
    if (r) {
      if (!newProjAllAvailableRooms.includes(r)) {
        setNewProjAllAvailableRooms([...newProjAllAvailableRooms, r]);
      }
      if (!newProjSelectedRooms.includes(r)) {
        setNewProjSelectedRooms([...newProjSelectedRooms, r]);
      }
    }
    setNewProjCustomRoomInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const projectRooms = newProjSelectedRooms.map((name, index) => ({
      id: "room_" + Date.now() + "_" + index,
      name: name
    }));

    const newProject = {
      id: Date.now().toString(),
      name: newProjName,
      description: "No description provided.",
      status: newProjStatus,
      completionDate: newProjCompletionDate || "",
      rooms: projectRooms,
      materials: [],
      tasks: [],
    };

    onAddProject(newProject);

    // Reset state
    setNewProjName("");
    setNewProjStatus("not-started");
    setNewProjCompletionDate("");
    setNewProjSelectedRooms([...activeDefaultRooms]);
    setNewProjAllAvailableRooms([...activeDefaultRooms]);
    setNewProjCustomRoomInput("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Project</h3>
          <button className="icon-btn" onClick={onClose}>
            <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Riverside Plaza Phase 2"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Initial Status</label>
            <select
              className="form-control"
              value={newProjStatus}
              onChange={(e) => setNewProjStatus(e.target.value)}
            >
              <option value="not-started">Not Started</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Target Completion Date</label>
            <input
              type="date"
              className="form-control"
              value={newProjCompletionDate}
              onChange={(e) => setNewProjCompletionDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Rooms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {newProjAllAvailableRooms.map((roomName) => {
                const isSelected = newProjSelectedRooms.includes(roomName);
                return (
                  <div
                    key={roomName}
                    onClick={() => {
                      if (isSelected) {
                        setNewProjSelectedRooms(newProjSelectedRooms.filter(r => r !== roomName));
                      } else {
                        setNewProjSelectedRooms([...newProjSelectedRooms, roomName]);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--accent-blue-light)' : 'transparent',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    {roomName}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add custom room (e.g. Master Bath)"
                value={newProjCustomRoomInput}
                onChange={(e) => setNewProjCustomRoomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRoomToNewProj();
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddCustomRoomToNewProj}
                style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
