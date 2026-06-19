import React from "react";
import { BookOpen, Search, Sliders, Plus, CheckSquare, Clock, MapPin, X, Trash2, Edit2, FileText, Download } from "lucide-react";
import { getDaysLeftTextAndColor, formatDisplayDateStr } from "../../utils/helpers";

const ProjectsList = (props) => {
  const { isNetworkOnline, cloudSyncEnabled, userRole, setIsCatalogScreenOpen, searchQuery, setSearchQuery, filteredProjects, setActiveProjectId, setProjectSubTab, handleDeleteProject } = props;
  return (
    <>

                      <div className="app-header fade-in">
                        <div className="header-left">
                          <div
                            className="header-title-container"
                            style={{ display: "flex", flexDirection: "column" }}
                          >
                            <span
                              className="header-brand"
                              style={{
                                fontSize: "22px",
                                fontWeight: "800",
                                color: "var(--text-title)",
                                fontFamily: "var(--font-title)",
                                lineHeight: "1.1",
                                letterSpacing: "-0.5px",
                              }}
                            >
                              WeaverBird
                            </span>
                            <span
                              className="header-subtitle"
                              style={{
                                fontSize: "10px",
                                fontWeight: "600",
                                color: "var(--accent-gold-dark)",
                                textTransform: "uppercase",
                                letterSpacing: "3.5px",
                                marginTop: "2px",
                                display: "inline-flex",
                                alignItems: "center",
                              }}
                            >
                              Interior Studio
                              {/* Online pill inline beside subtitle */}
                              {(() => {
                                const getStatus = () => {
                                  if (!isNetworkOnline) {
                                    return {
                                      text: "Offline",
                                      dotColor: "#e74c3c",
                                      bg: "rgba(231, 76, 60, 0.1)",
                                    };
                                  }
                                  if (!cloudSyncEnabled) {
                                    return {
                                      text: "Sync Off",
                                      dotColor: "#f5a623",
                                      bg: "rgba(245, 166, 35, 0.1)",
                                    };
                                  }
                                  return {
                                    text: "Online",
                                    dotColor: "#22c55e",
                                    bg: "rgba(34, 197, 94, 0.1)",
                                  };
                                };
                                const status = getStatus();
                                return (
                                  <span
                                    className="online-pill-inline"
                                    style={{
                                      backgroundColor: status.bg,
                                      color: status.dotColor,
                                    }}
                                  >
                                    <span
                                      className="status-dot"
                                      style={{
                                        backgroundColor: status.dotColor,
                                        boxShadow: `0 0 6px ${status.dotColor}`,
                                      }}
                                    />
                                    {status.text}
                                  </span>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                        {userRole === "admin" && (
                          <div className="header-right">
                            <button
                              className="icon-btn"
                              onClick={() => setIsCatalogScreenOpen(true)}
                              title="Open Material Price Catalog"
                              style={{ color: "var(--accent-gold-dark)" }}
                            >
                              <BookOpen size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="screen-content fade-in">
                        {/* Slim Search with filter icon */}
                        <div className="search-container">
                          <Search className="search-icon" size={16} />
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <Sliders className="search-filter-icon" size={15} />
                        </div>

                        {/* Project List */}
                        <div className="project-list">
                          {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => {
                              const urgency = getDaysLeftTextAndColor(project);
                              const totalMaterials = project.materials?.length || 0;
                              const completedMaterials = project.materials?.filter(m => m.completed).length || 0;
                              const pendingMaterials = totalMaterials - completedMaterials;

                              const totalTasks = project.tasks?.length || 0;
                              const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
                              const pendingTasks = totalTasks - completedTasks;

                              return (
                                <div
                                  key={project.id}
                                  className={`project-card ${urgency.urgencyClass}`}
                                  style={{ position: 'relative' }}
                                  onClick={() => {
                                    setActiveProjectId(project.id);
                                    setProjectSubTab("materials");
                                  }}
                                >
                                  <button
                                    className="action-icon-btn delete"
                                    style={{ position: 'absolute', top: '16px', right: '16px' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(project.id, e);
                                    }}
                                    aria-label="Delete Project"
                                  >
                                    <Trash2 size={14} />
                                  </button>

                                  <div className="project-info">
                                    <span className="project-name" style={{ paddingRight: '28px', display: 'block' }}>
                                      {project.name}
                                    </span>

                                    {/* Stats */}
                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-muted)", display: "flex", gap: "16px", fontWeight: "600" }}>
                                      <span>Materials: <strong style={{ color: "var(--text-title)" }}>{pendingMaterials}/{totalMaterials}</strong></span>
                                      <span>Works: <strong style={{ color: "var(--text-title)" }}>{pendingTasks}/{totalTasks}</strong></span>
                                    </div>

                                    {/* Target Date Pill & Status Pill */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                                      {project.completionDate && (
                                        <div className={`target-date-pill ${urgency.urgencyClass}`} style={{ marginTop: 0 }}>
                                          <Clock size={11} />
                                          <span>
                                            {formatDisplayDateStr(project.completionDate)} · {urgency.text}
                                          </span>
                                        </div>
                                      )}
                                      <span
                                        className={`status-pill ${project.status === "not-started"
                                          ? "not-started"
                                          : project.status
                                          }`}
                                      >
                                        {project.status.replace("-", " ")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "40px 20px",
                                color: "var(--text-muted)",
                              }}
                            >
                              No projects match your filters.
                            </div>
                          )}
                        </div>
                      </div>

    </>
  );
};

export default ProjectsList;
