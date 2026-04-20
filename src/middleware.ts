import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — shareable pages and auth flows stay accessible without a
// session. Everything else (library, playlists, history, account-scoped
// actions) requires sign-in.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/song/(.*)",
  "/album/(.*)",
  "/artist/(.*)",
  "/search(.*)",
  "/api/search(.*)",
  "/api/song(.*)",
  "/api/album(.*)",
  "/api/artist(.*)",
  "/api/stream(.*)",
  "/api/download(.*)",
  "/manifest.json",
  "/favicon.ico",
  "/icons/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets unless they appear in search params.
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
