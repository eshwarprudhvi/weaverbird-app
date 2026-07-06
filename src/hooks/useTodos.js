import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';
import { taskRepository } from '../repositories/TaskRepository';

export const useTodos = () => {
  const scope = useWorkspaceScope();
  
  const [todos, setTodos] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'todos') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('todos.updated', (newTodos) => {
      setTodos(newTodos || []);
    });
    return unsub;
  }, [scope.eventBus]);

  const handleAddTodo = async (text) => {
    if (!text.trim()) return;
    const tempId = `temp_${Date.now()}`;
    
    const optimisticTodo = {
      id: tempId,
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTodos((prev) => [optimisticTodo, ...prev]);

    try {
      await taskRepository.create(scope.workspaceId, {
        tempId,
        text: text.trim(),
        completed: false
      });
    } catch (err) {
      console.error("Failed to add task:", err);
      setTodos((prev) => prev.filter((t) => t.id !== tempId));
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, completed } : t))
    );

    try {
      await taskRepository.update(scope.workspaceId, todoId, { completed });
    } catch (err) {
      console.error("Failed to toggle task:", err);
      setTodos((prev) =>
        prev.map((t) => (t.id === todoId ? { ...t, completed: !completed } : t))
      );
    }
  };

  const handleEditTodo = async (todoId, text) => {
    if (!text.trim()) return;
    
    const oldTodo = todos.find((t) => t.id === todoId);
    const oldText = oldTodo ? oldTodo.text : "";

    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, text: text.trim() } : t))
    );

    try {
      await taskRepository.update(scope.workspaceId, todoId, { text: text.trim() });
    } catch (err) {
      console.error("Failed to edit task:", err);
      setTodos((prev) =>
        prev.map((t) => (t.id === todoId ? { ...t, text: oldText } : t))
      );
    }
  };

  const handleDeleteTodo = async (todoId) => {
    const oldTodo = todos.find((t) => t.id === todoId);

    setTodos((prev) => prev.filter((t) => t.id !== todoId));

    try {
      await taskRepository.delete(scope.workspaceId, todoId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      if (oldTodo) {
        setTodos((prev) => [oldTodo, ...prev]);
      }
    }
  };

  return {
    todos,
    setTodos,
    handleAddTodo,
    handleToggleTodo,
    handleEditTodo,
    handleDeleteTodo
  };
};
