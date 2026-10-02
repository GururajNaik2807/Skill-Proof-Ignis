const GITHUB_API_BASE = "https://api.github.com";

export async function fetchGitHub(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SkillProof-Engine",
    ...(options.headers as Record<string, string>),
  };

  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
  if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) < 5) {
    console.warn(`[GitHub API] Approaching rate limit. Remaining: ${rateLimitRemaining}`);
  }

  if (response.status === 403) {
    throw new Error("GitHub API rate limit exceeded. Please ensure GITHUB_TOKEN is configured in .env.local.");
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}