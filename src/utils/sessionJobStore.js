const isBrowserReload = () => {
  if (typeof window === "undefined" || !window.performance) return false;
  const navigation = performance.getEntriesByType?.("navigation")?.[0];
  return navigation?.type === "reload";
};

export const createSessionJobStore = (key, initialState) => {
  const loadState = () => {
    if (typeof window === "undefined") return initialState;

    if (isBrowserReload()) {
      sessionStorage.removeItem(key);
      return initialState;
    }

    try {
      const stored = sessionStorage.getItem(key);
      return stored ? { ...initialState, ...JSON.parse(stored) } : initialState;
    } catch (error) {
      console.error(`Failed to restore session state for ${key}:`, error);
      return initialState;
    }
  };

  let state = loadState();
  const listeners = new Set();

  const shouldPersist = (nextState) =>
    Object.values(nextState).some((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== false && value !== "";
    });

  const persist = () => {
    if (typeof window === "undefined") return;

    if (!shouldPersist(state)) {
      sessionStorage.removeItem(key);
      return;
    }

    sessionStorage.setItem(key, JSON.stringify(state));
  };

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  return {
    getState: () => state,
    setState: (patch) => {
      state = { ...state, ...patch };
      persist();
      notify();
    },
    reset: () => {
      state = { ...initialState };
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(key);
      }
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
  };
};
