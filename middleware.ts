import { type NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'adsense_session';

// Protected routes that require authentication
const protectedRoutes = {
  admin: ['/admin'],
  client: ['/dashboard'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isAdminRoute = protectedRoutes.admin.some((route) =>
    pathname.startsWith(route)
  );
  const isClientRoute = protectedRoutes.client.some((route) =>
    pathname.startsWith(route)
  );

  if (!isAdminRoute && !isClientRoute) {
    const response = NextResponse.next();
    const { searchParams } = request.nextUrl;
    response.headers.set('x-pathname', pathname);
    response.headers.set('x-search', searchParams.toString());
    return response;
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Check user type permissions
    if (isAdminRoute && sessionData.user.type !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (isClientRoute && sessionData.user.type !== 'client') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Add pathname and search to headers for layout access
    const response = NextResponse.next();
    const { searchParams } = request.nextUrl;
    response.headers.set('x-pathname', pathname);
    response.headers.set('x-search', searchParams.toString());
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - login page
     */
    '/((?!_next/static|_next/image|favicon.ico|api|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
