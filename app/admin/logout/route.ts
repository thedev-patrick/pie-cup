import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';

  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: 'admin-auth',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
