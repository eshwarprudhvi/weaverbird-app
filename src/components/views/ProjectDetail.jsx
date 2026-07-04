import React from "react";
import { Plus, CheckSquare, Clock, MapPin, X, Trash2, Edit2, FileText, Download, ArrowLeft, MoreHorizontal, MessageSquare, Phone, Image, Camera, User, Filter, Share2, Grid , MoreVertical, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import AppHeader from "../common/AppHeader";

const ProjectDetail = (props) => {
  const { companyName, setActiveProjectId, activeProject, getDaysLeftTextAndColor, formatDisplayDateStr, handleShareProjectOverview, generatePDFReport, setEditItemModal, activeRoomId, setActiveRoomId, openRoomMenuId, setOpenRoomMenuId, handleEditRoom, handleDeleteRoom, handleShareRoom, handleGenerateRoomPDF, projectSubTab, setProjectSubTab, handleShareMaterials, handleAddMaterial, newMaterialInput, setNewMaterialInput, handleToggleMaterial, handleDeleteMaterial, setMaterialsCollapsed, materialsCollapsed, handleClearCompletedMaterials, handleShareTasks, handleAddTask, newWorkInput, setNewWorkInput, newTaskPriority, setNewTaskPriority, getPriorityWeight, draggedTaskId, handleTaskDragStart, handleTaskDragOver, handleTaskDrop, handleToggleTask, handleDeleteTask, setTasksCollapsed, tasksCollapsed, handleClearCompletedTasks } = props;
  return (
<>
                      <AppHeader
                        variant="page"
                        title={activeProject?.name}
                        leftActions={
                          <button
                            className="icon-btn"
                            onClick={() => setActiveProjectId(null)}
                            aria-label="Back"
                          >
                            <ArrowLeft size={20} />
                          </button>
                        }
                        subtitleNode={
                          activeProject?.completionDate && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                color: getDaysLeftTextAndColor(activeProject).color,
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginLeft: '8px'
                              }}
                            >
                              <Clock size={10} />
                              Target: {formatDisplayDateStr(activeProject.completionDate)} ({getDaysLeftTextAndColor(activeProject).text})
                            </span>
                          )
                        }
                        rightActions={
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="icon-btn"
                              onClick={handleShareProjectOverview}
                              style={{ color: "#25D366" }}
                              aria-label="Share project overview to WhatsApp"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => generatePDFReport("both")}
                              style={{ color: "#ef4444" }}
                              aria-label="Export project report to PDF"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() =>
                                setEditItemModal({
                                  type: "project",
                                  itemId: activeProject.id,
                                  name: activeProject.name,
                                  status: activeProject.status,
                                  completionDate: activeProject.completionDate || "",
                                })
                              }
                              aria-label="Edit project metadata"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        }
                      />

                      {/* Target Completion Banner removed to reduce vertical spacing as target is already displayed in header */}

                      {activeRoomId === null ? (
                        // ROOMS LIST VIEW
                        <div className="screen-content fade-in" style={{ paddingTop: "12px" }}>
                          <div className="rooms-grid">
                            {(activeProject?.rooms || []).map((room) => {
                              const mTotal = activeProject?.materials?.filter(m => m.roomId === room.id)?.length || 0;
                              const mPending = activeProject?.materials?.filter(m => m.roomId === room.id && !m.completed)?.length || 0;
                              const tTotal = activeProject?.tasks?.filter(t => t.roomId === room.id)?.length || 0;
                              const tPending = activeProject?.tasks?.filter(t => t.roomId === room.id && !t.completed)?.length || 0;

                              return (
                                <div
                                  key={room.id}
                                  className="room-card fade-in"
                                  onClick={(e) => {
                                    if (!e.target.closest('.icon-btn') && !e.target.closest('.popover-menu')) {
                                      setActiveRoomId(room.id);
                                    }
                                  }}
                                  style={{ zIndex: openRoomMenuId === room.id ? 100 : 1 }}
                                >
                                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 12 }}>
                                    <button
                                      className="icon-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenRoomMenuId(openRoomMenuId === room.id ? null : room.id);
                                      }}
                                      style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                                    >
                                      <MoreVertical size={18} />
                                    </button>

                                    {openRoomMenuId === room.id && (
                                      <div 
                                        className="popover-menu" 
                                        onClick={(e) => e.stopPropagation()} 
                                        style={{ flexDirection: 'row', minWidth: 'auto', gap: '8px', padding: '8px', borderRadius: '12px', zIndex: 20 }}
                                      >
                                        <button
                                          className="room-action-btn edit"
                                          onClick={(e) => { e.stopPropagation(); handleEditRoom(e, room.id, room.name); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Edit Room Name"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          className="room-action-btn delete"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteRoom(e, room.id); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Delete Room"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                        <button
                                          className="room-action-btn share"
                                          onClick={(e) => { e.stopPropagation(); handleShareRoom(e, room); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Share Room to WhatsApp"
                                        >
                                          <Share2 size={14} />
                                        </button>
                                        <button
                                          className="room-action-btn pdf"
                                          onClick={(e) => { e.stopPropagation(); handleGenerateRoomPDF(e, room); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Download Room PDF"
                                        >
                                          <FileText size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="room-info">
                                    <span className="room-card-title" style={{ paddingRight: '40px', display: 'block', fontSize: '18px', fontWeight: '700', color: 'var(--text-title)' }}>
                                      {room.name}
                                    </span>

                                    {/* Stats */}
                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px", fontWeight: "600", paddingBottom: "4px" }}>
                                      <span>Materials: <strong style={{ color: "var(--text-title)" }}>{mPending}/{mTotal}</strong></span>
                                      <span>Works: <strong style={{ color: "var(--text-title)" }}>{tPending}/{tTotal}</strong></span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* General / Unassigned Room */}
                            {(() => {
                              const mTotal = activeProject?.materials?.filter(m => !m.roomId || m.roomId === "general")?.length || 0;
                              const mPending = activeProject?.materials?.filter(m => (!m.roomId || m.roomId === "general") && !m.completed)?.length || 0;
                              const tTotal = activeProject?.tasks?.filter(t => !t.roomId || t.roomId === "general")?.length || 0;
                              const tPending = activeProject?.tasks?.filter(t => (!t.roomId || t.roomId === "general") && !t.completed)?.length || 0;

                              return (
                                <div
                                  className="room-card general-room fade-in"
                                  onClick={(e) => {
                                    if (!e.target.closest('.icon-btn') && !e.target.closest('.popover-menu')) {
                                      setActiveRoomId("general");
                                    }
                                  }}
                                  style={{ zIndex: openRoomMenuId === "general" ? 100 : 1 }}
                                >
                                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 12 }}>
                                    <button
                                      className="icon-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenRoomMenuId(openRoomMenuId === "general" ? null : "general");
                                      }}
                                      style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                                    >
                                      <MoreVertical size={18} />
                                    </button>

                                    {openRoomMenuId === "general" && (
                                      <div 
                                        className="popover-menu" 
                                        onClick={(e) => e.stopPropagation()} 
                                        style={{ flexDirection: 'row', minWidth: 'auto', gap: '8px', padding: '8px', borderRadius: '12px', zIndex: 20 }}
                                      >
                                        <button
                                          className="room-action-btn share"
                                          onClick={(e) => { e.stopPropagation(); handleShareRoom(e, { id: 'general', name: 'General / Unassigned' }); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Share Room to WhatsApp"
                                        >
                                          <Share2 size={14} />
                                        </button>
                                        <button
                                          className="room-action-btn pdf"
                                          onClick={(e) => { e.stopPropagation(); handleGenerateRoomPDF(e, { id: 'general', name: 'General / Unassigned' }); setTimeout(() => setOpenRoomMenuId(null), 100); }}
                                          title="Download Room PDF"
                                        >
                                          <FileText size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div className="room-info">
                                    <span className="room-card-title" style={{ paddingRight: '40px', display: 'block', fontSize: '18px', fontWeight: '700', color: 'var(--text-title)' }}>
                                      General / Unassigned
                                    </span>

                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px", fontWeight: "600", paddingBottom: "4px" }}>
                                      <span>Materials: <strong style={{ color: "var(--text-title)" }}>{mPending}/{mTotal}</strong></span>
                                      <span>Works: <strong style={{ color: "var(--text-title)" }}>{tPending}/{tTotal}</strong></span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      ) : (
                        // ROOM DETAILS VIEW (Materials & Work tabs)
                        <>
                          {/* Room Header with Back Button to go back to Rooms List */}
                          <div className="app-header fade-in" style={{ paddingTop: "8px", paddingBottom: "0", minHeight: "auto" }}>
                            <div className="header-left">
                              <button
                                className="icon-btn"
                                onClick={() => setActiveRoomId(null)}
                                aria-label="Back to Rooms"
                              >
                                <ArrowLeft size={20} />
                              </button>
                              <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)' }}>
                                  {activeProject?.name || "Project"} <span style={{ color: 'var(--text-muted)', fontWeight: '400', margin: '0 4px' }}>&gt;</span> {activeRoomId === "general" ? "General / Unassigned" : (activeProject?.rooms?.find(r => r.id === activeRoomId)?.name || "Room")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Sub-tabs for Materials and Work */}
                          <div className="tabs-bar-new fade-in">
                            <button
                              className={`tab-btn-new ${projectSubTab === "materials" ? "active" : ""
                                }`}
                              onClick={() => setProjectSubTab("materials")}
                            >
                              Materials
                            </button>
                            <button
                              className={`tab-btn-new ${projectSubTab === "work" ? "active" : ""
                                }`}
                              onClick={() => setProjectSubTab("work")}
                            >
                              Work
                            </button>
                          </div>

                          <div
                            className="screen-content fade-in"
                            style={{ paddingTop: "0px" }}
                          >
                            {projectSubTab === "materials" ? (
                              // MATERIALS SUB-TAB (Screen 2 details)
                              <>
                                <div className="section-header-new">
                                  {/* Title removed to avoid repetition */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span className="section-count-new">
                                      {(activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed).length || 0)} ITEMS
                                    </span>
                                    <button
                                      className="icon-btn"
                                      onClick={handleShareMaterials}
                                      style={{ color: "#25D366", padding: "6px", background: "none", border: "none" }}
                                      title="Share pending materials to WhatsApp"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                    <button
                                      className="icon-btn"
                                      onClick={() => generatePDFReport("materials")}
                                      style={{ color: "#ef4444", padding: "6px", background: "none", border: "none" }}
                                      title="Download materials PDF report"
                                    >
                                      <FileText size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Add New Material Card */}
                                <div className="quick-add-card-new">
                                  {/* Title removed to save space */}
                                  <form onSubmit={handleAddMaterial} className="quick-add-new-form">
                                    <div className="quick-add-input-group-new">
                                      <input
                                        type="text"
                                        className="quick-add-new-input"
                                        placeholder="Enter material name"
                                        value={newMaterialInput}
                                        onChange={(e) => setNewMaterialInput(e.target.value)}
                                      />
                                      <button type="submit" className="quick-add-new-btn">
                                        Add
                                      </button>
                                    </div>
                                  </form>
                                </div>

                                {/* Materials List Table */}
                                <div className="checklist-table-new">
                                  <div className="list-columns-subheader-new">
                                    <span>DONE</span>
                                    <span>ITEM NAME</span>
                                    <span className="text-right">ACTIONS</span>
                                  </div>

                                  {/* Pending Materials List */}
                                  <div className="list-rows-container-new">
                                    {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed).length > 0 ? (
                                      activeProject.materials
                                        .filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed)
                                        .map((mat) => (
                                          <div key={mat.id} className="list-item-row-new">
                                            <label className="checkbox-container-new">
                                              <input
                                                type="checkbox"
                                                checked={mat.completed}
                                                onChange={() => handleToggleMaterial(mat.id)}
                                              />
                                              <span className="checkmark-new"></span>
                                            </label>
                                            <span className="list-item-text-new">
                                              {mat.name}
                                            </span>
                                            <div className="item-actions-new">
                                              <button
                                                className="action-text-btn-new"
                                                onClick={() =>
                                                  setEditItemModal({
                                                    type: "material",
                                                    projectId: activeProject.id,
                                                    itemId: mat.id,
                                                    name: mat.name,
                                                  })
                                                }
                                              >
                                                Edit
                                              </button>
                                              <span className="action-separator-new">|</span>
                                              <button
                                                className="action-text-btn-new delete"
                                                onClick={() => handleDeleteMaterial(mat.id)}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <div className="empty-list-message-new">
                                        No pending materials. All clean!
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Collapsible Completed Materials Section */}
                                <div
                                  className="collapsible-header-new"
                                  onClick={() => setMaterialsCollapsed(!materialsCollapsed)}
                                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="collapsible-title-new" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <Clock size={15} />
                                      Completed Materials
                                    </span>
                                    <span className="collapsible-badge-new">
                                      {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length || 0}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleClearCompletedMaterials();
                                        }}
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "11px",
                                          borderRadius: "6px",
                                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                                          color: "#ef4444",
                                          border: "1px solid rgba(239, 68, 68, 0.2)",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          position: "relative",
                                          zIndex: 2
                                        }}
                                      >
                                        Clear Completed
                                      </button>
                                    )}
                                    <span className="collapsible-arrow-new" style={{ display: "flex" }}>
                                      {materialsCollapsed ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronUp size={16} />
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {!materialsCollapsed && (
                                  <div className="collapsible-content-new">
                                    {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length > 0 ? (
                                      activeProject.materials
                                        .filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed)
                                        .map((mat) => (
                                          <div key={mat.id} className="list-item-row-new completed-row-new">
                                            <label className="checkbox-container-new">
                                              <input
                                                type="checkbox"
                                                checked={mat.completed}
                                                onChange={() => handleToggleMaterial(mat.id)}
                                              />
                                              <span className="checkmark-new"></span>
                                            </label>
                                            <span className="list-item-text-new completed">
                                              {mat.name}
                                            </span>
                                            <div className="item-actions-new">
                                              <button
                                                className="action-text-btn-new delete"
                                                onClick={() => handleDeleteMaterial(mat.id)}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <div className="empty-list-message-new">
                                        No completed materials yet.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              // WORK/TASKS SUB-TAB (Screen 3 details)
                              <>
                                <div className="section-header-new">
                                  {/* Title removed to avoid repetition */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span className="section-count-new">
                                      {(activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed).length || 0)} ITEMS
                                    </span>
                                    <button
                                      className="icon-btn"
                                      onClick={handleShareTasks}
                                      style={{ color: "#25D366", padding: "6px", background: "none", border: "none" }}
                                      title="Share pending tasks to WhatsApp"
                                    >
                                      <Share2 size={16} />
                                    </button>
                                    <button
                                      className="icon-btn"
                                      onClick={() => generatePDFReport("tasks")}
                                      style={{ color: "#ef4444", padding: "6px", background: "none", border: "none" }}
                                      title="Download works PDF report"
                                    >
                                      <FileText size={16} />
                                    </button>
                                  </div>
                                </div>

                                {/* Add New Work Card */}
                                <div className="quick-add-card-new">
                                  {/* Title removed to save space */}
                                  <form onSubmit={handleAddTask} className="quick-add-new-form">
                                    <div className="quick-add-input-group-new">
                                      <input
                                        type="text"
                                        className="quick-add-new-input"
                                        placeholder="Enter work description"
                                        value={newWorkInput}
                                        onChange={(e) => setNewWorkInput(e.target.value)}
                                      />
                                      <button type="submit" className="quick-add-new-btn">
                                        Add
                                      </button>
                                    </div>
                                  </form>

                                  {/* Priority Selector */}
                                  <div className="priority-selector-new">
                                    <span className="priority-label-new">Priority:</span>
                                    <div className="priority-pills-new">
                                      <button
                                        type="button"
                                        className={`priority-pill-new high ${newTaskPriority === "high" ? "active" : ""}`}
                                        onClick={() => setNewTaskPriority("high")}
                                      >
                                        High
                                      </button>
                                      <button
                                        type="button"
                                        className={`priority-pill-new medium ${newTaskPriority === "medium" ? "active" : ""}`}
                                        onClick={() => setNewTaskPriority("medium")}
                                      >
                                        Medium
                                      </button>
                                      <button
                                        type="button"
                                        className={`priority-pill-new low ${newTaskPriority === "low" ? "active" : ""}`}
                                        onClick={() => setNewTaskPriority("low")}
                                      >
                                        Low
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Tasks List Table */}
                                <div className="checklist-table-new">
                                  <div className="list-columns-subheader-new">
                                    <span>DONE</span>
                                    <span>TASK DESCRIPTION</span>
                                    <span className="text-right">ACTIONS</span>
                                  </div>

                                  {/* Pending Tasks List */}
                                  <div className="list-rows-container-new">
                                    {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed).length > 0 ? (
                                      [...activeProject.tasks]
                                        .filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed)
                                        .sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
                                        .map((task) => (
                                          <div
                                            key={task.id}
                                            className={`list-item-row-new task-row-new ${draggedTaskId === task.id ? "dragging-new" : ""
                                              }`}
                                            draggable={true}
                                            onDragStart={(e) => handleTaskDragStart(e, task.id)}
                                            onDragOver={handleTaskDragOver}
                                            onDrop={(e) => handleTaskDrop(e, task.id)}
                                          >
                                            <div className="drag-handle-new">
                                              <GripVertical size={14} />
                                            </div>
                                            <label className="checkbox-container-new">
                                              <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleTask(task.id)}
                                              />
                                              <span className="checkmark-new"></span>
                                            </label>
                                            <div className="list-item-text-with-badge-new">
                                              <span className="list-item-text-new">
                                                {task.name}
                                              </span>
                                              <span className={`task-priority-badge-new ${task.priority || "medium"}`}>
                                                {task.priority || "medium"}
                                              </span>
                                            </div>
                                            <div className="item-actions-new">
                                              <button
                                                className="action-text-btn-new"
                                                onClick={() =>
                                                  setEditItemModal({
                                                    type: "task",
                                                    projectId: activeProject.id,
                                                    itemId: task.id,
                                                    name: task.name,
                                                    priority: task.priority || "medium",
                                                    dependencies: task.dependencies || [],
                                                  })
                                                }
                                              >
                                                Edit
                                              </button>
                                              <span className="action-separator-new">|</span>
                                              <button
                                                className="action-text-btn-new delete"
                                                onClick={() => handleDeleteTask(task.id)}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <div className="empty-list-message-new">
                                        No pending tasks. All clean!
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Collapsible Completed Tasks Section */}
                                <div
                                  className="collapsible-header-new"
                                  onClick={() => setTasksCollapsed(!tasksCollapsed)}
                                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span className="collapsible-title-new" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <Clock size={15} />
                                      Completed Tasks
                                    </span>
                                    <span className="collapsible-badge-new">
                                      {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length || 0}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleClearCompletedTasks();
                                        }}
                                        style={{
                                          padding: "4px 10px",
                                          fontSize: "11px",
                                          borderRadius: "6px",
                                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                                          color: "#ef4444",
                                          border: "1px solid rgba(239, 68, 68, 0.2)",
                                          cursor: "pointer",
                                          fontWeight: "600",
                                          position: "relative",
                                          zIndex: 2
                                        }}
                                      >
                                        Clear Completed
                                      </button>
                                    )}
                                    <span className="collapsible-arrow-new" style={{ display: "flex" }}>
                                      {tasksCollapsed ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronUp size={16} />
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {!tasksCollapsed && (
                                  <div className="collapsible-content-new">
                                    {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length > 0 ? (
                                      activeProject.tasks
                                        .filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed)
                                        .map((task) => (
                                          <div key={task.id} className="list-item-row-new completed-row-new">
                                            <label className="checkbox-container-new">
                                              <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => handleToggleTask(task.id)}
                                              />
                                              <span className="checkmark-new"></span>
                                            </label>
                                            <span className="list-item-text-new completed">
                                              {task.name}
                                            </span>
                                            <div className="item-actions-new">
                                              <button
                                                className="action-text-btn-new delete"
                                                onClick={() => handleDeleteTask(task.id)}
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                    ) : (
                                      <div className="empty-list-message-new">
                                        No completed tasks yet.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
</>
  );
};

export default ProjectDetail;
