import { fetchGitHub } from "./client";

export interface ScannedRepo {
  name: string;
  html_url: string;
  description: string | null;
  is_fork: boolean;
  primary_language: string | null;
  languages: Record<string, number>;
  last_commit_at: string | null;
  has_tests: boolean;
  has_docker: boolean;
  has_ci: boolean;
  manifest_files: string[];
  detected_dependencies: string[];
}

// Common package manifests to look for in root tree
const MANIFEST_NAMES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "Gemfile",
  "composer.json",
];

// Patterns signaling test presence
const TEST_PATTERNS = [
  "test",
  "tests",
  "__tests__",
  "spec",
  "specs",
  "pytest.ini",
  "jest.config.js",
  "jest.config.ts",
  "vitest.config.ts",
];

export async function scanUserRepositories(username: string, maxRepos = 15): Promise<ScannedRepo[]> {
  // 1. Fetch user's public repos sorted by recently pushed
  const repos = await fetchGitHub(
    `/users/${encodeURIComponent(username)}/repos?sort=pushed&direction=desc&per_page=${maxRepos}&type=owner`
  );

  const scannedRepos: ScannedRepo[] = [];

  for (const repo of repos) {
    // Skip forks to prioritize original code written by candidate
    if (repo.fork) continue;

    try {
      // 2. Fetch language breakdown (bytes per language)
      let languages: Record<string, number> = {};
      try {
        languages = await fetchGitHub(`/repos/${username}/${repo.name}/languages`);
      } catch (err) {
        console.warn(`Could not fetch languages for ${repo.name}:`, err);
      }

      // 3. Inspect repository root tree / file list
      let hasTests = false;
      let hasDocker = false;
      let hasCi = false;
      const manifestFiles: string[] = [];
      const detectedDependencies: string[] = [];

      try {
        const branch = repo.default_branch || "main";
        const treeData = await fetchGitHub(
          `/repos/${username}/${repo.name}/git/trees/${branch}?recursive=1`
        );

        if (treeData && Array.isArray(treeData.tree)) {
          for (const item of treeData.tree) {
            const path: string = item.path.toLowerCase();

            // Detect Test Suites
            if (TEST_PATTERNS.some((p) => path.includes(p))) {
              hasTests = true;
            }

            // Detect Docker & Container configs
            if (path.includes("dockerfile") || path.includes("docker-compose")) {
              hasDocker = true;
            }

            // Detect CI / GitHub Actions
            if (path.startsWith(".github/workflows")) {
              hasCi = true;
            }

            // Detect Manifest Files
            const baseName = item.path.split("/").pop();
            if (baseName && MANIFEST_NAMES.includes(baseName)) {
              manifestFiles.push(item.path);

              // If it's package.json, fetch and inspect dependency names
              if (baseName === "package.json" && manifestFiles.length <= 3) {
                try {
                  const contentData = await fetchGitHub(
                    `/repos/${username}/${repo.name}/contents/${item.path}`
                  );
                  if (contentData?.content) {
                    const decoded = Buffer.from(contentData.content, "base64").toString("utf-8");
                    const parsed = JSON.parse(decoded);
                    const allDeps = {
                      ...(parsed.dependencies || {}),
                      ...(parsed.devDependencies || {}),
                    };
                    Object.keys(allDeps).forEach((dep) => detectedDependencies.push(dep));
                  }
                } catch {
                  // Silent fallback if file read fails
                }
              }

              // If it's requirements.txt, fetch dependencies
              if (baseName === "requirements.txt" && manifestFiles.length <= 3) {
                try {
                  const contentData = await fetchGitHub(
                    `/repos/${username}/${repo.name}/contents/${item.path}`
                  );
                  if (contentData?.content) {
                    const decoded = Buffer.from(contentData.content, "base64").toString("utf-8");
                    const lines = decoded.split("\n");
                    lines.forEach((line) => {
                      const clean = line.split(/[=<>~#]/)[0].trim().toLowerCase();
                      if (clean) detectedDependencies.push(clean);
                    });
                  }
                } catch {
                  // Silent fallback
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Could not inspect tree for ${repo.name}:`, err);
      }

      scannedRepos.push({
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
        is_fork: repo.fork,
        primary_language: repo.language,
        languages,
        last_commit_at: repo.pushed_at,
        has_tests: hasTests,
        has_docker: hasDocker,
        has_ci: hasCi,
        manifest_files: manifestFiles,
        detected_dependencies: Array.from(new Set(detectedDependencies)),
      });
    } catch (err) {
      console.error(`Error processing repo ${repo.name}:`, err);
    }
  }

  return scannedRepos;
}