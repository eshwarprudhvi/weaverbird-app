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
    
    const updated = [optimisticTodo, ...todos];
    setTodos(updated);
    scope.storage.setItem(scope.workspaceId, 'todos', updated);

    try {
      const createdItem = await taskRepository.create(scope.workspaceId, {
        tempId,
        text: text.trim(),
        completed: false
      });
      // Replace the temp ID in React state immediately with the real Firestore item
      const newUpdated = updated.map((t) => (t.id === tempId ? createdItem : t));
      setTodos(newUpdated);
      scope.storage.setItem(scope.workspaceId, 'todos', newUpdated);
    } catch (err) {
      console.error("Failed to add task:", err);
      const reverted = todos.filter((t) => t.id !== tempId);
      setTodos(reverted);
      scope.storage.setItem(scope.workspaceId, 'todos', reverted);
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    const updated = todos.map((t) => (t.id === todoId ? { ...t, completed } : t));
    setTodos(updated);
    scope.storage.setItem(scope.workspaceId, 'todos', updated);

    try {
      await taskRepository.update(scope.workspaceId, todoId, { completed });
    } catch (err) {
      console.error("Failed to toggle task:", err);
      const reverted = todos.map((t) => (t.id === todoId ? { ...t, completed: !completed } : t));
      setTodos(reverted);
      scope.storage.setItem(scope.workspaceId, 'todos', reverted);
    }
  };

  const handleEditTodo = async (todoId, text) => {
    if (!text.trim()) return;
    
    const oldTodo = todos.find((t) => t.id === todoId);
    const oldText = oldTodo ? oldTodo.text : "";

    const updated = todos.map((t) => (t.id === todoId ? { ...t, text: text.trim() } : t));
    setTodos(updated);
    scope.storage.setItem(scope.workspaceId, 'todos', updated);

    try {
      await taskRepository.update(scope.workspaceId, todoId, { text: text.trim() });
    } catch (err) {
      console.error("Failed to edit task:", err);
      const reverted = todos.map((t) => (t.id === todoId ? { ...t, text: oldText } : t));
      setTodos(reverted);
      scope.storage.setItem(scope.workspaceId, 'todos', reverted);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    const oldTodo = todos.find((t) => t.id === todoId);

    const updated = todos.filter((t) => t.id !== todoId);
    setTodos(updated);
    scope.storage.setItem(scope.workspaceId, 'todos', updated);

    try {
      await taskRepository.delete(scope.workspaceId, todoId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      if (oldTodo) {
        const reverted = [oldTodo, ...todos.filter((t) => t.id !== todoId)];
        setTodos(reverted);
        scope.storage.setItem(scope.workspaceId, 'todos', reverted);
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
