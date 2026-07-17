// src/screens/admin/ui/usePagedList.js
// Shared pagination for Admin list screens — the debounce/append/reset logic that
// Students and Parents were each repeating. `fetcher` is a stable (useCallback) function
// of (page, pageSize) → Paged<T>; wrap it with your filter deps so a filter change
// reloads page 1 automatically.
import { useState, useEffect, useCallback, useRef } from 'react';

export function usePagedList(fetcher, pageSize = 20) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const load = useCallback(async (pageNum, replace) => {
    const my = ++reqId.current;
    if (replace) { setLoading(true); setError(null); } else { setLoadingMore(true); }
    try {
      const res = await fetcher(pageNum, pageSize);
      if (my !== reqId.current) return;
      setTotal(res?.total || 0);
      setTotalPages(res?.totalPages || 1);
      setPage(res?.page || pageNum);
      setRows((prev) => (replace ? (res?.rows || []) : [...prev, ...(res?.rows || [])]));
    } catch (e) {
      if (my !== reqId.current) return;
      if (replace) setError(e?.response?.data?.error || e?.message || 'Could not load this list.');
    } finally {
      if (my === reqId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [fetcher, pageSize]);

  // Reload from page 1 whenever the fetcher (i.e. the filters) changes.
  useEffect(() => { load(1, true); }, [load]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && page < totalPages) load(page + 1, false);
  }, [loading, loadingMore, page, totalPages, load]);

  const reload = useCallback(() => load(1, true), [load]);

  return { rows, total, totalPages, page, loading, loadingMore, error, loadMore, reload };
}
