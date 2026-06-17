import React from 'react';
import { Folder, Calendar, Plus, User } from 'lucide-react';

export default function BottomNav({
  isKeyboardVisible,
  currentTab,
  setCurrentTab,
  setActiveProjectId,
  handleNavbarAddClick
}) {
  if (isKeyboardVisible) return null;

  return (
    <div className="bottom-nav">
      <button
        className={`nav-tab ${currentTab === "projects" ? "active" : ""}`}
        onClick={() => {
          setCurrentTab("projects");
          setActiveProjectId(null); // Return to project dashboard list
        }}
      >
        <div className="nav-icon-wrapper">
          <Folder size={20} />
        </div>
        <span className="nav-label">Projects</span>
      </button>

      <button
        className={`nav-tab ${currentTab === "schedule" ? "active" : ""}`}
        onClick={() => setCurrentTab("schedule")}
      >
        <div className="nav-icon-wrapper">
          <Calendar size={20} />
        </div>
        <span className="nav-label">Schedule</span>
      </button>

      {/* Center Hump with + Button */}
      <div
        className="nav-hump-container"
        style={{ visibility: currentTab === "profile" ? "hidden" : "visible" }}
      >
        <div className="nav-hump"></div>
        <button
          type="button"
          className="nav-add-btn"
          onClick={handleNavbarAddClick}
          aria-label="Add Item"
        >
          <Plus size={24} />
        </button>
      </div>

      <button
        className={`nav-tab ${currentTab === "profile" ? "active" : ""}`}
        onClick={() => setCurrentTab("profile")}
      >
        <div className="nav-icon-wrapper">
          <User size={20} />
        </div>
        <span className="nav-label">Profile</span>
      </button>
    </div>
  );
}
