const CACHE_KEY_PREFIX = "skillproof_dash_cache_";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export interface CachedDashboardPayload {
  timestamp: number;
  profile: unknown;
  repositories: unknown[];
  resumeSkills: unknown[];
  evidenceList: unknown[];
  tasks: unknown[];
}

export function getCachedDashboard(userId: string): CachedDashboardPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!raw) return null;

    const parsed: CachedDashboardPayload = JSON.parse(raw);
    const isExpired = Date.now() - parsed.timestamp > DEFAULT_TTL_MS;

    if (isExpired) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn("Failed to read dashboard cache from localStorage:", err);
    return null;
  }
}

export function setCachedDashboard(userId: string, data: Omit<CachedDashboardPayload, "timestamp">): void {
  if (typeof window === "undefined") return;

  try {
    const payload: CachedDashboardPayload = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to write dashboard cache to localStorage:", err);
  }
}

export function clearDashboardCache(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
}