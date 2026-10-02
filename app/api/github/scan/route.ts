import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scanUserRepositories } from "@/lib/github/scanner";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get user's GitHub username from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("github_username")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_username) {
      return NextResponse.json(
        { error: "No GitHub username linked. Please complete onboarding first." },
        { status: 400 }
      );
    }

    // 2. Scan repositories
    const scanned = await scanUserRepositories(profile.github_username, 15);

    // 3. Persist scanned repos into github_repositories table
    const upsertPayload = scanned.map((repo) => ({
      user_id: user.id,
      repo_name: repo.name,
      repo_url: repo.html_url,
      is_fork: repo.is_fork,
      primary_language: repo.primary_language,
      languages_breakdown: repo.languages,
      last_commit_at: repo.last_commit_at,
      has_tests: repo.has_tests,
      has_docker: repo.has_docker,
    }));

    if (upsertPayload.length > 0) {
      // Clear previous repo scans for freshness or perform upsert
      await supabase
        .from("github_repositories")
        .delete()
        .eq("user_id", user.id);

      const { error: insertError } = await supabase
        .from("github_repositories")
        .insert(upsertPayload);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: scanned.length,
      repositories: scanned,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "GitHub scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}