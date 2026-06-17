import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function AddMeetingModal({ isOpen, onClose, onAddMeeting }) {
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState(() => new Date().toISOString().split("T")[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMeetTitle.trim()) return;

    const meeting = {
      id: Date.now().toString(),
      title: newMeetTitle,
      date: newMeetDate,
      completed: false,
    };

    onAddMeeting(meeting);

    // Reset state
    setNewMeetTitle("");
    setNewMeetDate(new Date().toISOString().split("T")[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Schedule Sync Meeting</h3>
          <button className="icon-btn" onClick={onClose}>
            <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meeting Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Supplier Review / Design Alignment"
              value={newMeetTitle}
              onChange={(e) => setNewMeetTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Meeting Date</label>
            <input
              type="date"
              className="form-control"
              value={newMeetDate}
              onChange={(e) => setNewMeetDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
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
              Add Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
