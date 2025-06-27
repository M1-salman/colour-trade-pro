import { apiAuthPrefix, authRoutes } from "@/routes";
import { auth } from "./auth";

export default auth((req): any => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // api/auth routes
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  //private routes
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isHomeRoute = nextUrl.pathname === "/";

  // Allow every api route
  if (isApiAuthRoute) {
    return null;
  }
  // check if user is logged in, then reroute or display page based on status
  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/trade", nextUrl));
    }
    return null;
  }
  // if user is not logged in, redirect to register page
  if (!isLoggedIn && !isHomeRoute) {
    return Response.redirect(new URL("/auth/register", nextUrl));
  }
  return null;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
