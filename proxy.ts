import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define authorized admin email addresses directly
const ALLOWED_ADMINS = ["captain@gmail.com", "manager@yourshop.com"];

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options) {
          response.cookies.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        },
      },
    },
  );

  // Refresh session if necessary
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  // Protect admin routes
  if (isAdminRoute && !isLoginPage) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const email = session.user.email;

    if (!email || !ALLOWED_ADMINS.includes(email)) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/admin/login?error=unauthorized", req.url),
      );
    }
  }

  // Prevent logged-in admins from visiting login page
  if (
    isLoginPage &&
    session?.user.email &&
    ALLOWED_ADMINS.includes(session.user.email)
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
