import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PATH = '/admin';
const LOGIN_PATH = '/admin/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PATH)) {
    return;
  }

  if (pathname === LOGIN_PATH) {
    return;
  }

  const authCookie = request.cookies.get('admin-auth')?.value;
  if (authCookie !== 'true') {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = `from=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
