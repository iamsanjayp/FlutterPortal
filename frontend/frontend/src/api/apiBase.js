const envBase = import.meta.env.VITE_API_BASE;
const useEnvBase = envBase && envBase !== "auto";
const fallbackOrigin = typeof window !== "undefined" && window.location?.origin
  ? window.location.origin
  : "http://localhost:5173";

export const API_BASE_ROOT = useEnvBase ? envBase : fallbackOrigin;
export const API_BASE = `${API_BASE_ROOT}/api`;
