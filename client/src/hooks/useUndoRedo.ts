import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoActions {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  set: (newState: any) => void;
  reset: (newState: any) => void;
  clear: () => void;
}

export function useUndoRedo<T>(initialState: T, maxHistorySize: number = 50): [T, UndoRedoActions] {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const isUndoRedoAction = useRef(false);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const undo = useCallback(() => {
    setState(currentState => {
      const { past, present, future } = currentState;
      if (past.length === 0) return currentState;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      isUndoRedoAction.current = true;
      
      return {
        past: newPast,
        present: previous,
        future: [present, ...future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      const { past, present, future } = currentState;
      if (future.length === 0) return currentState;

      const next = future[0];
      const newFuture = future.slice(1);

      isUndoRedoAction.current = true;

      return {
        past: [...past, present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const set = useCallback((newState: T) => {
    // Don't create history entry if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setState(currentState => {
      const { past, present } = currentState;
      
      // Don't add to history if state hasn't actually changed
      if (JSON.stringify(present) === JSON.stringify(newState)) {
        return currentState;
      }

      const newPast = [...past, present];
      
      // Limit history size
      if (newPast.length > maxHistorySize) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: newState,
        future: []
      };
    });
  }, [maxHistorySize]);

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const clear = useCallback(() => {
    setState(currentState => ({
      past: [],
      present: currentState.present,
      future: []
    }));
  }, []);

  return [
    state.present,
    {
      canUndo,
      canRedo,
      undo,
      redo,
      set,
      reset,
      clear
    }
  ];
}