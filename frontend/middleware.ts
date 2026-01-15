import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// All routes are public - anyone can access the chatbot
// Clerk will still detect signed-in users and show their profile
const isPublicRoute = createRouteMatcher(["/(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // No protection needed - all routes are public
  // Clerk still tracks authentication state for signed-in users
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
