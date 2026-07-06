import { Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckSquare, Trash2, Edit2 } from "lucide-react";
import TodoView from "./TodoView";
import AppHeader from "../common/AppHeader";

const MeetingsView = (props) => {
  const {
    setIsTodoScreenOpen,
    isTodoScreenOpen,
    todos,
    setTodos,
    newTodoInput,
    setNewTodoInput,
    editTodoId,
    setEditTodoId,
    editTodoText,
    setEditTodoText,
    todayMeetingsCount,
    tomorrowMeetingsCount,
    setEditItemModal,
    handleDeleteMeeting,
    handleToggleMeeting,
    calendarCollapsed,
    setCalendarCollapsed,
    selectedCalendarDate,
    setSelectedCalendarDate,
    formatDate,
    currentCalendarDate,
    handlePrevMonth,
    handleNextMonth,
    getDaysInMonth,
    meetings,
    sortedAndFilteredMeetings
  } = props;

  return (
    <>
      <AppHeader 
        variant="page"
        title="Meetings"
        rightActions={
          <button
            className="icon-btn todo-header-btn"
            onClick={() => setIsTodoScreenOpen(true)}
            aria-label="Open To-Do List"
            title="To-Do List"
          >
            <CheckSquare size={20} />
            {todos.filter((t) => !t.completed).length > 0 && (
              <span className="todo-badge">
                {todos.filter((t) => !t.completed).length}
              </span>
            )}
          </button>
        }
      />
      {/* ===== TODO FULL SCREEN OVERLAY ===== */}
      {isTodoScreenOpen && (
        <TodoView
          setIsTodoScreenOpen={setIsTodoScreenOpen}
          todos={todos}
          setTodos={setTodos}
          newTodoInput={newTodoInput}
          setNewTodoInput={setNewTodoInput}
          editTodoId={editTodoId}
          setEditTodoId={setEditTodoId}
          editTodoText={editTodoText}
          setEditTodoText={setEditTodoText}
        />
      )}

      {/* Unified meetings list */}
      {!isTodoScreenOpen && (
        <div
          className="screen-content fade-in"
          style={{ paddingTop: "12px" }}
        >
          {/* Meetings Stats Card (Hero) */}
          <div className="schedule-hero" style={{ padding: "16px 20px" }}>
            <div className="schedule-stats-row">
              <div className="schedule-stat-card">
                <div className="schedule-stat-title">Scheduled Today</div>
                <div className="schedule-stat-number">
                  {todayMeetingsCount}
                </div>
              </div>
              <div className="schedule-stat-card">
                <div className="schedule-stat-title">
                  Scheduled Tomorrow
                </div>
                <div className="schedule-stat-number">
                  {tomorrowMeetingsCount}
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Calendar Header */}
          <div
            className="collapsible-header"
            onClick={() => setCalendarCollapsed(!calendarCollapsed)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              marginBottom: "12px",
            }}
          >
            <div
              className="collapsible-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar
                size={18}
                style={{ color: "var(--accent-gold-dark)" }}
              />
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--text-title)",
                }}
              >
                Meetings Calendar{" "}
                {selectedCalendarDate &&
                  `(${formatDate(selectedCalendarDate)})`}
              </span>
            </div>
            {calendarCollapsed ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronUp size={18} />
            )}
          </div>

          {/* Monthly Calendar View */}
          {!calendarCollapsed && (
            <div
              className="calendar-card"
              style={{ marginTop: "-4px", marginBottom: "16px" }}
            >
              <div
                className="calendar-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handlePrevMonth}
                    style={{ padding: "4px" }}
                    aria-label="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3
                    style={{
                      margin: 0,
                      minWidth: "120px",
                      textAlign: "center",
                    }}
                  >
                    {currentCalendarDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={handleNextMonth}
                    style={{ padding: "4px" }}
                    aria-label="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                {selectedCalendarDate && (
                  <button
                    className="calendar-clear-btn"
                    onClick={() => setSelectedCalendarDate(null)}
                  >
                    Show All
                  </button>
                )}
              </div>
              <div className="calendar-weekdays">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>
              <div className="calendar-grid">
                {getDaysInMonth().map((dayStr, idx) => {
                  if (!dayStr) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="calendar-day empty"
                      ></div>
                    );
                  }

                  const dayNum = parseInt(dayStr.split("-")[2], 10);
                  const hasMeetings = meetings.some(
                    (s) => s.date === dayStr && !s.completed
                  );
                  const isSelected = selectedCalendarDate === dayStr;
                  const isToday = dayStr === new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={dayStr}
                      className={`calendar-day ${hasMeetings ? "has-meetings" : ""
                        } ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCalendarDate(null);
                        } else {
                          setSelectedCalendarDate(dayStr);
                        }
                      }}
                    >
                      <span className="day-number">{dayNum}</span>
                      {hasMeetings && <span className="day-dot"></span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meetings Lists */}
          <div className="list-section-card">
            <div
              className="list-columns-subheader"
              style={{ gridTemplateColumns: "46px 1fr 70px" }}
            >
              <span>Done</span>
              <span>Sync Info</span>
              <span className="text-right">Actions</span>
            </div>

            <div>
              {sortedAndFilteredMeetings.length > 0 ? (
                sortedAndFilteredMeetings.map((meet) => (
                  <div
                    key={meet.id}
                    className="list-item-row"
                    style={{ gridTemplateColumns: "46px 1fr 70px" }}
                  >
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={meet.completed}
                        onChange={() => handleToggleMeeting(meet.id)}
                      />
                      <span className="checkmark"></span>
                    </label>

                    <div className="schedule-item-info">
                      <span
                        className={`schedule-item-title ${meet.completed ? "completed" : ""
                          }`}
                      >
                        {meet.title}
                      </span>
                      <span className="schedule-item-time">
                        {formatDate(meet.date)}
                      </span>
                    </div>

                    <div className="item-actions">
                      <button
                        className="action-icon-btn"
                        onClick={() =>
                          setEditItemModal({
                            type: "meeting",
                            itemId: meet.id,
                            name: meet.title,
                            date: meet.date,
                          })
                        }
                        aria-label="Edit Meeting"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="action-icon-btn delete"
                        onClick={() => handleDeleteMeeting(meet.id)}
                        aria-label="Delete Meeting"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 20px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  No meetings scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeetingsView;
