import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeRole, workspaceForRole } from "@/lib/auth/roles";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Bypass auth checks gracefully if Supabase environment variables are not yet configured
  const isValidUrl = supabaseUrl && (supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"));
  if (!isValidUrl || !supabaseKey || supabaseKey.startsWith("your_")) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh auth session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup");
    const isDashboardRoute =
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/onboarding") ||
      request.nextUrl.pathname.startsWith("/matrix") ||
      request.nextUrl.pathname.startsWith("/jobs") ||
      request.nextUrl.pathname.startsWith("/tasks");
    const isRecruiterRoute = request.nextUrl.pathname.startsWith("/recruiter");

    if (!user && (isDashboardRoute || isRecruiterRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && (isAuthRoute || isDashboardRoute || isRecruiterRoute)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = normalizeRole(profile?.role ?? user.user_metadata?.role);

      if (!role) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "profile-role-required");
        return NextResponse.redirect(url);
      }

      const url = request.nextUrl.clone();
      if (isAuthRoute) {
        url.pathname = workspaceForRole(role);
        return NextResponse.redirect(url);
      }

      if ((isDashboardRoute && role === "recruiter") || (isRecruiterRoute && role === "candidate")) {
        url.pathname = workspaceForRole(role);
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error("Supabase middleware error:", error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};