import React, { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, CheckSquare } from 'lucide-react';

const TodoView = (props) => {
  const { setIsTodoScreenOpen, todos, setTodos } = props;
  const [newTodoInput, setNewTodoInput] = useState("");
  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodoText, setEditTodoText] = useState("");
  return (
                    <div className="todo-screen-overlay">
                      <div className="app-header fade-in">
                        <div className="header-left">
                          <button
                            className="icon-btn"
                            onClick={() => setIsTodoScreenOpen(false)}
                            aria-label="Back to Meetings"
                          >
                            <ArrowLeft size={20} />
                          </button>
                          <h1>To-Do List</h1>
                        </div>
                        <div className="header-right">
                          <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                            {todos.filter((t) => !t.completed).length} pending
                          </span>
                        </div>
                      </div>

                      <div className="screen-content fade-in" style={{ paddingTop: "12px" }}>
                        {/* Add Todo Form */}
                        <div className="todo-add-form" style={{ marginBottom: "20px" }}>
                          <input
                            type="text"
                            className="todo-add-input"
                            placeholder="What needs to be done?"
                            value={newTodoInput}
                            onChange={(e) => setNewTodoInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newTodoInput.trim()) {
                                const newTodo = {
                                  id: "todo_" + Date.now(),
                                  text: newTodoInput.trim(),
                                  completed: false,
                                  createdAt: new Date().toISOString(),
                                };
                                setTodos((prev) => [newTodo, ...prev]);
                                setNewTodoInput("");
                              }
                            }}
                          />
                          <button
                            className="todo-add-btn"
                            onClick={() => {
                              if (newTodoInput.trim()) {
                                const newTodo = {
                                  id: "todo_" + Date.now(),
                                  text: newTodoInput.trim(),
                                  completed: false,
                                  createdAt: new Date().toISOString(),
                                };
                                setTodos((prev) => [newTodo, ...prev]);
                                setNewTodoInput("");
                              }
                            }}
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        {/* Pending Todos */}
                        {todos.filter((t) => !t.completed).length > 0 && (
                          <div className="todo-group">
                            <div className="todo-group-label">Pending</div>
                            <div className="todo-section-card">
                              <div className="todo-items-list">
                                {todos.filter((t) => !t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((todo) => (
                                  <div
                                    key={todo.id}
                                    className="todo-item-row"
                                  >
                                    <label className="checkbox-container">
                                      <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => {
                                          setTodos((prev) =>
                                            prev.map((t) =>
                                              t.id === todo.id
                                                ? { ...t, completed: !t.completed }
                                                : t
                                            )
                                          );
                                        }}
                                      />
                                      <span className="checkmark"></span>
                                    </label>

                                    <div className="todo-item-content">
                                      {editTodoId === todo.id ? (
                                        <input
                                          type="text"
                                          className="todo-edit-input"
                                          value={editTodoText}
                                          autoFocus
                                          onChange={(e) => setEditTodoText(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && editTodoText.trim()) {
                                              setTodos((prev) =>
                                                prev.map((t) =>
                                                  t.id === todo.id
                                                    ? { ...t, text: editTodoText.trim() }
                                                    : t
                                                )
                                              );
                                              setEditTodoId(null);
                                              setEditTodoText("");
                                            } else if (e.key === "Escape") {
                                              setEditTodoId(null);
                                              setEditTodoText("");
                                            }
                                          }}
                                          onBlur={() => {
                                            if (editTodoText.trim()) {
                                              setTodos((prev) =>
                                                prev.map((t) =>
                                                  t.id === todo.id
                                                    ? { ...t, text: editTodoText.trim() }
                                                    : t
                                                )
                                              );
                                            }
                                            setEditTodoId(null);
                                            setEditTodoText("");
                                          }}
                                        />
                                      ) : (
                                        <span className="todo-item-text">
                                          {todo.text}
                                        </span>
                                      )}
                                    </div>

                                    <div className="item-actions">
                                      <button
                                        className="action-icon-btn"
                                        onClick={() => {
                                          setEditTodoId(todo.id);
                                          setEditTodoText(todo.text);
                                        }}
                                        aria-label="Edit Todo"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        className="action-icon-btn delete"
                                        onClick={() => {
                                          setTodos((prev) =>
                                            prev.filter((t) => t.id !== todo.id)
                                          );
                                        }}
                                        aria-label="Delete Todo"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Completed Todos */}
                        {todos.filter((t) => t.completed).length > 0 && (
                          <div className="todo-group">
                            <div className="todo-group-label">Completed</div>
                            <div className="todo-section-card">
                              <div className="todo-items-list">
                                {todos.filter((t) => t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((todo) => (
                                  <div
                                    key={todo.id}
                                    className="todo-item-row completed"
                                  >
                                    <label className="checkbox-container">
                                      <input
                                        type="checkbox"
                                        checked={todo.completed}
                                        onChange={() => {
                                          setTodos((prev) =>
                                            prev.map((t) =>
                                              t.id === todo.id
                                                ? { ...t, completed: !t.completed }
                                                : t
                                            )
                                          );
                                        }}
                                      />
                                      <span className="checkmark"></span>
                                    </label>

                                    <div className="todo-item-content">
                                      <span className="todo-item-text completed">
                                        {todo.text}
                                      </span>
                                    </div>

                                    <div className="item-actions">
                                      <button
                                        className="action-icon-btn delete"
                                        onClick={() => {
                                          setTodos((prev) =>
                                            prev.filter((t) => t.id !== todo.id)
                                          );
                                        }}
                                        aria-label="Delete Todo"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {todos.length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "40px 20px",
                              color: "var(--text-muted)",
                              fontSize: "14px",
                            }}
                          >
                            <CheckSquare size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                            <div>No to-dos yet.</div>
                            <div style={{ fontSize: "12px", marginTop: "4px" }}>Add one using the field above!</div>
                          </div>
                        )}
                      </div>
                    </div>
);
};

export default TodoView;
