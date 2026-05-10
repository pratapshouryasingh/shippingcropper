export const createPageStateStore = (initialState) => {
  let state = { ...initialState };
  const listeners = new Set();

  return {
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    reset: () => {
      state = { ...initialState };
      listeners.forEach((listener) => listener(state));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
};
