import { useCallback, useEffect, useState } from 'react';

interface AsyncDataState<T> {
  data: T | null;
  error: unknown;
  isLoading: boolean;
}

/**
 * Loads data for `key` (e.g. the signed-in farmer's uid) and reloads when the key changes.
 * `load` must be a stable function, such as a service function.
 * Results from a previous key are ignored if they arrive late.
 */
export function useAsyncData<T>(key: string | null, load: (key: string) => Promise<T>) {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    error: null,
    isLoading: key !== null,
  });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (key === null) {
      setState({ data: null, error: null, isLoading: false });
      return;
    }

    let isCurrent = true;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    load(key).then(
      (data) => {
        if (isCurrent) setState({ data, error: null, isLoading: false });
      },
      (error: unknown) => {
        if (isCurrent) setState({ data: null, error, isLoading: false });
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [key, load, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}
