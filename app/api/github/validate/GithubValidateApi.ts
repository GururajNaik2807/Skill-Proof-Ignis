import { NextResponse } from "next/server";
import { githubSchema } from "@/lib/validation/onboarding";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = githubSchema.safeParse(body);

    if (!result.success) {
    return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
    );
    }

    const { username } = result.data;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SkillProof-App",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: `GitHub user "${username}" not found.` },
        { status: 404 }
      );
    }

    if (res.status === 403) {
      return NextResponse.json(
        { error: "GitHub rate limit exceeded. Check server token." },
        { status: 403 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to verify GitHub profile." },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      valid: true,
      username: data.login,
      name: data.name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      publicRepos: data.public_repos,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
