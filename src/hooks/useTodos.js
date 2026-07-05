import { useState, useEffect } from 'react';
import { useWorkspaceScope } from '../application/session';

export const useTodos = () => {
  const scope = useWorkspaceScope();
  
  const [todos, setTodos] = useState(() => {
    return scope.storage.getItem(scope.workspaceId, 'todos') || [];
  });

  useEffect(() => {
    const unsub = scope.eventBus.on('todos.updated', (newTodos) => {
      setTodos(newTodos);
    });
    return unsub;
  }, [scope.eventBus]);

  return {
    todos,
    setTodos
  };
};
