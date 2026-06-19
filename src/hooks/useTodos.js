import { useState } from 'react';

export const useTodos = () => {
  const [todos, setTodos] = useState([]);

  return {
    todos,
    setTodos
  };
};
