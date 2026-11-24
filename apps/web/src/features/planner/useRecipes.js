import { useEffect, useState } from "react";

export async function request(path, options = {}) {
  const response = await globalThis.fetch("/api" + path, {
    credentials: "same-origin",
    ...options,
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const error = new Error(
      data?.message || "Chưa tải được dữ liệu. Vui lòng thử lại.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
export function useResource(path, revision = 0) {
  const [state, setState] = useState({});
  const [attempt, retry] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new globalThis.AbortController();
    const key = { path, revision, attempt };
    request(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ ...key, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ ...key, error });
      });
    return () => controller.abort();
  }, [path, revision, attempt]);
  const current =
    path === state.path &&
    state.revision === revision &&
    state.attempt === attempt;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !!path && !current,
    retry: () => retry((n) => n + 1),
  };
}
export function useDebounce(value, ms = 350) {
  const [result, setResult] = useState(value);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setResult(value), ms);
    return () => globalThis.clearTimeout(timer);
  }, [value, ms]);
  return result;
}
