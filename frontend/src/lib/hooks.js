import { useEffect, useState, useCallback } from "react";

/** Load data with loading / error / retry handling. `fn` re-runs whenever `deps` change. */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: "", status: 0, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ data, error: "", status: 200, loading: false }))
      .catch((e) => alive && setState({ data: null, error: e.message || "Something went wrong.", status: e.status || 0, loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Sets the browser tab title and announces page changes to screen readers. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | LearnHub` : "LearnHub: Online and Offline Courses";
  }, [title]);
}
