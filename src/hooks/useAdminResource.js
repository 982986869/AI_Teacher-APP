// src/hooks/useAdminResource.js
// Tiny data hook for Admin screens: runs an async fetcher, tracks loading/error, and
// exposes reload(). Mirrors the web portal's useApi contract so screens read the same.
// Pass a stable fetcher (wrap in useCallback) — it re-runs whenever `fetcher` changes.
import { useState, useEffect, useCallback, useRef } from 'react';

export function useAdminResource(fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.resolve()
      .then(fetcher)
      .then((d) => { if (!cancelled && alive.current) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (cancelled || !alive.current) return;
        const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Something went wrong.';
        setError(msg);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetcher, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, reload };
}
