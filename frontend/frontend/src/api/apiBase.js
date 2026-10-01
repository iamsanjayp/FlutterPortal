const envBase = import.meta.env.VITE_API_BASE;
const useEnvBase = envBase && envBase !== "auto";
const fallbackOrigin = typeof window !== "undefined" && window.location?.origin
  ? window.location.origin
  : "http://localhost:5173";
const appBase = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export const API_BASE_ROOT = useEnvBase
  ? envBase.replace(/\/$/, "")
  : `${fallbackOrigin}${appBase}`;

export const API_BASE = envBase && envBase.endsWith("/api")
  ? envBase
  : `${API_BASE_ROOT}/api`;

